import * as net from 'net';
import { watch } from 'chokidar';

import { RsBuffer } from './net/rs-buffer';
import { World } from './world/world';
import { ClientConnection } from './net/client-connection';
import { logger } from '@runejs/logger';
import { EarlyFormatGameCache, NewFormatGameCache } from '@runejs/cache-parser';
import { parseServerConfig, ServerConfig } from '@server/world/config/server-config';

import { loadPlugins } from '@server/plugins/plugin-loader';
import { ActionPlugin, ActionType } from '@server/plugins/plugin';

import { setNpcPlugins } from '@server/world/actor/player/action/npc-action';
import { setObjectPlugins } from '@server/world/actor/player/action/object-action';
import { setItemOnItemPlugins } from '@server/world/actor/player/action/item-on-item-action';
import { setButtonPlugins } from '@server/world/actor/player/action/button-action';
import { setCommandPlugins } from '@server/world/actor/player/action/input-command-action';
import { setWidgetPlugins } from '@server/world/actor/player/action/widget-action';

export let serverConfig: ServerConfig;
export let gameCache377: EarlyFormatGameCache;
export let gameCache: NewFormatGameCache;
export let world: World;

export async function injectPlugins(): Promise<void> {
    const actionTypes: { [key: string]: ActionPlugin[] } = {};
    const plugins = await loadPlugins();

    plugins.map(plugin => plugin.actions).reduce((a, b) => a.concat(b)).forEach(action => {
        if(!actionTypes.hasOwnProperty(action.type)) {
            actionTypes[action.type] = [];
        }

        actionTypes[action.type].push(action);
    });

    setButtonPlugins(actionTypes[ActionType.BUTTON]);
    setNpcPlugins(actionTypes[ActionType.NPC_ACTION]);
    setObjectPlugins(actionTypes[ActionType.OBJECT_ACTION]);
    setItemOnItemPlugins(actionTypes[ActionType.ITEM_ON_ITEM]);
    setCommandPlugins(actionTypes[ActionType.COMMAND]);
    setWidgetPlugins(actionTypes[ActionType.WIDGET_ACTION]);
}

export function runGameServer(): void {
    serverConfig = parseServerConfig();

    if(!serverConfig) {
        logger.error('Unable to start server due to missing or invalid server configuration.');
        return;
    }

    gameCache377 = new EarlyFormatGameCache('cache/377', { loadMaps: true, loadDefinitions: false, loadWidgets: false });
    gameCache = new NewFormatGameCache('cache/435');
    world = new World();
    world.init();
    injectPlugins();

    if(process.argv.indexOf('-fakePlayers') !== -1) {
        world.generateFakePlayers();
    }

    process.on('unhandledRejection', (err, promise) => {
        if(err === 'WIDGET_CLOSED') {
            return;
        }

        console.error('Unhandled rejection (promise: ', promise, ', reason: ', err, ').');
    });

    net.createServer(socket => {
        logger.info('Socket opened');
        // socket.setNoDelay(true);
        let clientConnection = new ClientConnection(socket);

        socket.on('data', data => {
            if(clientConnection) {
                clientConnection.parseIncomingData(new RsBuffer(data));
            }
        });

        socket.on('close', () => {
            if(clientConnection) {
                clientConnection.connectionDestroyed();
                clientConnection = null;
            }
        });

        socket.on('error', error => {
            socket.destroy();
            logger.error('Socket destroyed due to connection error.');
        });
    }).listen(serverConfig.port, serverConfig.host);

    logger.info(`Game server listening on port ${serverConfig.port}.`);

    const watcher = watch('dist/plugins/');
    watcher.on('ready', function() {
        watcher.on('all', function() {
            Object.keys(require.cache).forEach(function(id) {
                if (/[\/\\]plugins[\/\\]/.test(id)) delete require.cache[id];
            });
        })
    });
}
