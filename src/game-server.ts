import * as net from 'net';
import yargs from 'yargs';
import { watch } from 'chokidar';

import { RsBuffer } from './net/rs-buffer';
import { World } from './world/world';
import { ClientConnection } from './net/client-connection';
import { logger } from '@runejs/logger';
import { GameCache } from '@runejs/cache-parser';
import { NpcActionPlugin, setNpcPlugins } from '@server/world/mob/player/action/npc-action';
import { ObjectActionPlugin, setObjectPlugins } from '@server/world/mob/player/action/object-action';
import { BASE_PLUGIN_DIRECTORY, loadPlugins } from '@server/plugins/plugin-loader';
import { ItemOnItemActionPlugin, setItemOnItemPlugins } from '@server/world/mob/player/action/item-on-item-action';
import { ButtonActionPlugin, setButtonPlugins } from '@server/world/mob/player/action/button-action';
import { parseServerConfig, ServerConfig } from '@server/world/config/server-config';

export let serverConfig: ServerConfig;
export let gameCache: GameCache;
export let world: World;

export async function injectPlugins(): Promise<void> {
    async function inject<T>(path: string): Promise<T[]> {
        return await loadPlugins('.' + BASE_PLUGIN_DIRECTORY + '/' + path);
    }

    const promises = [
        inject<NpcActionPlugin>('npc').then(setNpcPlugins),
        inject<ObjectActionPlugin>('object').then(setObjectPlugins),
        inject<ItemOnItemActionPlugin>('item-on-item').then(setItemOnItemPlugins),
        inject<ButtonActionPlugin>('buttons').then(setButtonPlugins)
    ];

    await Promise.all(promises);
}

export function runGameServer(): void {
    serverConfig = parseServerConfig();

    if(!serverConfig) {
        logger.error('Unable to start server due to missing or invalid server configuration.');
        return;
    }

    gameCache = new GameCache('cache');
    world = new World();
    world.init();
    injectPlugins();

    if(yargs.argv.fakePlayers) {
        world.generateFakePlayers();
    }

    process.on('unhandledRejection', (err, promise) => {
        if(err === 'INTERFACE_CLOSED') {
            return;
        }

        console.error('Unhandled rejection (promise: ', promise, ', reason: ', err, ').');
        throw err;
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
