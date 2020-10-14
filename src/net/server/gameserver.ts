import { Socket } from 'net';
import { openServer, SocketConnectionHandler } from '@server/net/server-handler';
import { ByteBuffer } from '@runejs/byte-buffer';
import { parseServerConfig } from '@server/world/config/server-config';
import { logger } from '@runejs/logger/dist/logger';

enum ConnectionStage {
    HANDSHAKE = 'handshake',
    AUTHENTICATION = 'authentication',
    ACTIVE = 'active'
}

export class GameServerConnection extends SocketConnectionHandler {

    private connectionStage: ConnectionStage = ConnectionStage.HANDSHAKE;

    public constructor(private readonly clientSocket: Socket) {
        super();
    }

    public async dataReceived(buffer: ByteBuffer): Promise<void> {
        return Promise.resolve();
    }

}

export const createGameServerConnection =
    (socket: Socket): GameServerConnection => new GameServerConnection(socket);

export const launchGameServer = (): void => {
    const serverConfig = parseServerConfig();

    if(!serverConfig) {
        logger.error('Unable to start gameserver due to missing or invalid server configuration.');
        return;
    }

    openServer(serverConfig.host, serverConfig.port, 'game_server');
};
