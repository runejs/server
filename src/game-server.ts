import * as net from 'net';
import { watch } from 'chokidar';
import * as CRC32 from 'crc-32';

import { World } from './world/world';
import { ClientConnection } from './net/client-connection';
import { logger } from '@runejs/logger';
import { Cache } from '@runejs/cache-parser';
import { parseServerConfig, ServerConfig } from '@server/world/config/server-config';
import { ByteBuffer } from '@runejs/byte-buffer';

import { loadPlugins } from '@server/plugins/plugin-loader';
import { ActionPlugin, ActionType, sort } from '@server/plugins/plugin';

import { setNpcPlugins } from '@server/world/actor/player/action/npc-action';
import { setObjectPlugins } from '@server/world/actor/player/action/object-action';
import { setItemOnItemPlugins } from '@server/world/actor/player/action/item-on-item-action';
import { setButtonPlugins } from '@server/world/actor/player/action/button-action';
import { setCommandPlugins } from '@server/world/actor/player/action/input-command-action';
import { setWidgetPlugins } from '@server/world/actor/player/action/widget-action';
import { setItemPlugins } from '@server/world/actor/player/action/item-action';
import { setWorldItemPlugins } from '@server/world/actor/player/action/world-item-action';
import { setItemOnObjectPlugins } from '@server/world/actor/player/action/item-on-object-action';
import { setItemOnNpcPlugins } from '@server/world/actor/player/action/item-on-npc-action';
import { setPlayerInitPlugins } from '@server/world/actor/player/player';
import { setNpcInitPlugins } from '@server/world/actor/npc/npc';
import { setQuestPlugins } from '@server/world/config/quests';
import { setPlayerPlugins } from '@server/world/actor/player/action/player-action';


export let serverConfig: ServerConfig;
export let cache: Cache;
export let world: World;
export let crcTable: ByteBuffer;

export async function injectPlugins(): Promise<void> {
    const actionPluginMap: { [key: string]: ActionPlugin[] } = {};
    const plugins = await loadPlugins();

    plugins.map(plugin => plugin.actions).reduce((a, b) => a.concat(b)).forEach(action => {
        if(!actionPluginMap.hasOwnProperty(action.type)) {
            actionPluginMap[action.type] = [];
        }

        actionPluginMap[action.type].push(action);
    });

    Object.keys(actionPluginMap).forEach(key => actionPluginMap[key] = sort(actionPluginMap[key]));

    setQuestPlugins(actionPluginMap[ActionType.QUEST]);
    setButtonPlugins(actionPluginMap[ActionType.BUTTON]);
    setNpcPlugins(actionPluginMap[ActionType.NPC_ACTION]);
    setObjectPlugins(actionPluginMap[ActionType.OBJECT_ACTION]);
    setItemOnObjectPlugins(actionPluginMap[ActionType.ITEM_ON_OBJECT_ACTION]);
    setItemOnNpcPlugins(actionPluginMap[ActionType.ITEM_ON_NPC_ACTION]);
    setItemOnItemPlugins(actionPluginMap[ActionType.ITEM_ON_ITEM_ACTION]);
    setItemPlugins(actionPluginMap[ActionType.ITEM_ACTION]);
    setWorldItemPlugins(actionPluginMap[ActionType.WORLD_ITEM_ACTION]);
    setCommandPlugins(actionPluginMap[ActionType.COMMAND]);
    setWidgetPlugins(actionPluginMap[ActionType.WIDGET_ACTION]);
    setPlayerInitPlugins(actionPluginMap[ActionType.PLAYER_INIT]);
    setNpcInitPlugins(actionPluginMap[ActionType.NPC_INIT]);
    setPlayerPlugins(actionPluginMap[ActionType.PLAYER_ACTION]);
}

function generateCrcTable(): void {
    const index = cache.metaChannel;
    const indexLength = index.length;
    const buffer = new ByteBuffer(4048);
    buffer.put(0, 'BYTE');
    buffer.put(indexLength, 'INT');
    for(let file = 0; file < (indexLength / 6); file++) {
        const crcValue = CRC32.buf(cache.getRawFile(255, file));
        buffer.put(crcValue, 'INT');
    }

    crcTable = buffer;
}

function openServer(): void {
    net.createServer(socket => {
        socket.setNoDelay(true);
        socket.setKeepAlive(true);
        socket.setTimeout(30000);

        let clientConnection = new ClientConnection(socket);

        socket.on('data', data => {
            if(clientConnection) {
                clientConnection.parseIncomingData(new ByteBuffer(data));
            }
        });

        socket.on('close', () => {
            if(clientConnection) {
                clientConnection.connectionDestroyed();
                clientConnection = null;
            }
        });

        socket.on('error', error => {
            logger.error('Socket destroyed due to connection error.');
            logger.error(error.message);
            socket.destroy();
        });
    }).listen(serverConfig.port, serverConfig.host);

    logger.info(`Game server listening on port ${ serverConfig.port }.`);
}

export async function runGameServer(): Promise<void> {
    serverConfig = parseServerConfig();

    if(!serverConfig) {
        logger.error('Unable to start server due to missing or invalid server configuration.');
        return;
    }

    cache = new Cache('cache', {
        items: true, npcs: true, locationObjects: true, mapData: true, widgets: true
    });
    generateCrcTable();

    // @TODO keep these in the login server so they don't eat game server memory :)
    // delete cache.dataChannel;
    // delete cache.metaChannel;
    // delete cache.indexChannels;
    // delete cache.indices;

    world = new World();
    await injectPlugins();

    world.init(); // .then(() => delete cache.mapData);

    if(process.argv.indexOf('-fakePlayers') !== -1) {
        world.generateFakePlayers();
    }

    openServer();

    const watcher = watch('dist/plugins/');
    watcher.on('ready', () => {
        watcher.on('all', () => {
            Object.keys(require.cache).forEach((id) => {
                if(/[\/\\]plugins[\/\\]/.test(id)) {
                    delete require.cache[id];
                }
            });
        });
    });
}
