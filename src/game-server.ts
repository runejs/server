import * as net from 'net';
import { join } from 'path';
import yargs from 'yargs';

import { RsBuffer } from './net/rs-buffer';
import { World } from './world/world';
import { ClientConnection } from './net/client-connection';
import { logger } from '@runejs/logger';
import { GameCache } from '@runejs/cache-parser';
import { loadPlugins } from '@server/plugins/plugin-loader';
import { NpcActionPlugin, setNpcPlugins } from '@server/world/mob/player/action/npc-action';
import { plugins as npcPlugins } from '@server/plugins/npc-plugin/npc-plugins';
import { ObjectActionPlugin, setObjectPlugins } from '@server/world/mob/player/action/object-action';
import { plugins as objectPlugins } from '@server/plugins/object-plugin/object-plugins';

const GAME_SERVER_PORT = 43594;

export const serverDir = join(__dirname, '../');
export const gameCache = new GameCache(join(serverDir, 'cache'));
export const world = new World();
world.init();

loadPlugins<NpcActionPlugin>('npc-plugin', npcPlugins).then(plugins => setNpcPlugins(plugins));
loadPlugins<ObjectActionPlugin>('object-plugin', objectPlugins).then(plugins => setObjectPlugins(plugins));

if(yargs.argv.fakePlayers) {
    world.generateFakePlayers();
}

export function runGameServer(): void {
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
    }).listen(GAME_SERVER_PORT, '127.0.0.1');

    logger.info(`Game server listening on port ${GAME_SERVER_PORT}.`);
}
