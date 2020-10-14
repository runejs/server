import { Socket } from 'net';
import { openServer, SocketConnectionHandler } from '@server/net/server/server-gateway';
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
        if(!buffer) {
            logger.info('No data supplied in message to game server.');
            return;
        }

        return Promise.resolve();
    }

}

export const createGameServerConnection =
    (socket: Socket): GameServerConnection => new GameServerConnection(socket);

export const launchGameServer = (): void => {
    const serverConfig = parseServerConfig();

    if(!serverConfig) {
        logger.error('Unable to start game server due to missing or invalid server configuration.');
        return;
    }

    openServer(serverConfig.host, serverConfig.port, 'game_server');
};
