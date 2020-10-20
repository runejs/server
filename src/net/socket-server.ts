import { createServer, Socket } from 'net';
import { ByteBuffer } from '@runejs/byte-buffer';
import { logger } from '@runejs/logger';

export abstract class SocketConnectionHandler {

    protected constructor() {
    }

    abstract async dataReceived(data: ByteBuffer): Promise<void>;
    abstract connectionDestroyed(): void;

}

function socketError<T extends SocketConnectionHandler>(socket: Socket, connectionHandler: T, error): void {
    connectionHandler.connectionDestroyed();
    logger.error('Socket destroyed due to connection error.');
    logger.error(error?.message || '[no message]');
    socket.destroy();
}

function registerSocket<T extends SocketConnectionHandler>(socket: Socket, connectionHandlerFactory: (socket: Socket) => T): void {
    socket.setNoDelay(true);
    socket.setKeepAlive(true);
    socket.setTimeout(30000);

    const connection: T = connectionHandlerFactory(socket);

    socket.on('data', async data => {
        try {
            await connection.dataReceived(new ByteBuffer(data));
        } catch(e) {
            logger.error(e);
            socket.destroy();
        }
    });

    socket.on('close', () => {
        // @TODO socket close event
    });

    socket.on('error', error => socketError(socket, connection, error));
}

export function openServer<T extends SocketConnectionHandler>(name: string, host: string, port: number, connectionHandlerFactory: (socket: Socket) => T): void {
    createServer(socket => registerSocket<T>(socket, connectionHandlerFactory)).listen(port, host);
    logger.info(`${ name } listening @ ${ host }:${ port }.`);
}
