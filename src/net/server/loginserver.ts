import { Socket } from 'net';
import { openServer, SocketConnectionHandler } from '@server/net/server-handler';
import { ByteBuffer } from '@runejs/byte-buffer';
import { parseServerConfig } from '@server/world/config/server-config';
import { logger } from '@runejs/logger/dist/logger';

enum ConnectionStage {
    HANDSHAKE = 'handshake',
    ACTIVE = 'active'
}

class LoginServerConnection extends SocketConnectionHandler {

    private connectionStage: ConnectionStage = ConnectionStage.HANDSHAKE;

    public constructor(private readonly gameServerSocket: Socket) {
        super();
    }

    public async dataReceived(buffer: ByteBuffer): Promise<void> {
        switch(this.connectionStage) {
            case ConnectionStage.HANDSHAKE:
                break;
            default:
                break;
        }

        return Promise.resolve();
    }

}

export const createLoginServerConnection =
    (socket: Socket): LoginServerConnection => new LoginServerConnection(socket);

export const launchLoginServer = (): void => {
    const serverConfig = parseServerConfig();

    if(!serverConfig) {
        logger.error('Unable to start loginserver due to missing or invalid server configuration.');
        return;
    }

    openServer(serverConfig.host, serverConfig.port, 'game_server');
};
