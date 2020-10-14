import net, { Socket } from 'net';
import { ByteBuffer } from '@runejs/byte-buffer';
import { logger } from '@runejs/logger/dist/logger';
import { parseServerConfig } from '@server/world/config/server-config';
import { ClientConnection } from '@server/net/client-connection';

enum ConnectionStage {
    VERSION_HANDSHAKE = 'VERSION_HANDSHAKE',
    UPDATE_SERVER = 'UPDATE_SERVER',
    LOGIN_HANDSHAKE = 'LOGIN_HANDSHAKE',
    LOGIN = 'LOGIN',
    LOGGED_IN = 'LOGGED_IN'
}

function openServer(): void {
    const serverConfig = parseServerConfig();

    if(!serverConfig) {
        logger.error('Unable to start loginserver due to missing or invalid server configuration.');
        return;
    }

    net.createServer(socket => {
        socket.setNoDelay(true);
        socket.setKeepAlive(true);
        socket.setTimeout(30000);

        let loginServerConnection = new ClientConnection(socket, 'login');

        socket.on('data', data => {
            if(loginServerConnection) {
                loginServerConnection.parseIncomingData(new ByteBuffer(data));
            }
        });

        socket.on('close', () => {
            if(loginServerConnection) {
                loginServerConnection.connectionDestroyed();
                loginServerConnection = null;
            }
        });

        socket.on('error', error => {
            logger.error('Socket destroyed due to connection error.');
            logger.error(error.message);
            socket.destroy();
        });
    }).listen(serverConfig.loginServerPort, serverConfig.loginServerHost);

    logger.info(`Loginserver listening @ ${ serverConfig.loginServerHost }:${ serverConfig.loginServerPort }.`);
}

export function runLoginServer(): void {
    openServer();
}

runLoginServer();
