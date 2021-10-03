import { logger } from '@runejs/core';
import { parseServerConfig, SocketServer } from '@runejs/core/net';
import { Filestore } from '@runejs/filestore';

import { activateGameWorld } from '@engine/world';
import { loadCoreConfigurations, loadGameConfigurations, xteaRegions } from '@engine/config';
import { loadPackets } from '@engine/net';
import { watchForChanges, watchSource } from '@engine/util';
import { GatewayServer } from '@server/gateway';
import { GameServerConfig } from '@server/game';


/**
 * The singleton instance containing the server's active configuration settings.
 */
export let serverConfig: GameServerConfig;


/**
 * The singleton instance referencing the game's asset file store.
 */
export let filestore: Filestore;


export const openGatewayServer = (host: string, port: number): void =>
    SocketServer.launch<GatewayServer>(
        'Game Gateway Server',
        host, port, socket => new GatewayServer(socket));


/**
 * Configures the game server, parses the asset file store, initializes the game world,
 * and finally spins up the game server itself.
 */
export async function launchGameServer(): Promise<void> {
    serverConfig = parseServerConfig<GameServerConfig>();

    if(!serverConfig) {
        logger.error('Unable to start server due to missing or invalid server configuration.');
        return;
    }

    await loadCoreConfigurations();
    filestore = new Filestore('cache', { xteas: xteaRegions });

    await loadGameConfigurations();
    await loadPackets();

    const world = await activateGameWorld();

    if(process.argv.indexOf('-fakePlayers') !== -1) {
        world.generateFakePlayers();
    }

    openGatewayServer(serverConfig.host, serverConfig.port);

    watchSource('src/').subscribe(() => world.saveOnlinePlayers());
    watchForChanges('dist/plugins/', /[/\\]plugins[/\\]/);
}



