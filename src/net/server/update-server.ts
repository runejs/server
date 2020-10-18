import { createServer, Socket } from 'net';
import { SocketConnectionHandler } from '@server/net/server/server-gateway';
import { ByteBuffer } from '@runejs/byte-buffer';
import { logger } from '@runejs/logger/dist/logger';
import * as CRC32 from 'crc-32';
import { Cache } from '@runejs/cache-parser';

const cache: Cache = new Cache('cache', false);
let crcTable: ByteBuffer;

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

enum ConnectionStage {
    HANDSHAKE = 'handshake',
    ACTIVE = 'active'
}

class UpdateServerConnection implements SocketConnectionHandler {

    private connectionStage: ConnectionStage = ConnectionStage.HANDSHAKE;
    private files: { file: number, index: number }[] = [];

    public constructor(private readonly gameServerSocket: Socket) {
    }

    public async dataReceived(buffer: ByteBuffer): Promise<void> {
        if(!buffer) {
            logger.info('No data supplied in message to update server.');
            return;
        }

        switch(this.connectionStage) {
            case ConnectionStage.HANDSHAKE:
                const gameVersion = buffer.get('INT');
                const outputBuffer = new ByteBuffer(1);

                if(gameVersion === 435) {
                    outputBuffer.put(0); // good to go!
                    this.connectionStage = ConnectionStage.ACTIVE;
                    this.gameServerSocket.write(outputBuffer);
                } else {
                    outputBuffer.put(6); // out of date
                    this.gameServerSocket.write(outputBuffer);
                }
                break;
            case ConnectionStage.ACTIVE:
                while(buffer.readable >= 4) {
                    const type = buffer.get('BYTE', 'UNSIGNED');
                    const index = buffer.get('BYTE', 'UNSIGNED');
                    const file = buffer.get('SHORT', 'UNSIGNED');

                    switch(type) {
                        case 0: // queue
                            this.files.push({ index, file });
                            break;
                        case 1: // immediate
                            this.gameServerSocket.write(this.generateFile(index, file));
                            break;
                        case 2:
                        case 3: // clear queue
                            this.files = [];
                            break;
                        case 4: // error
                            break;
                    }

                    while(this.files.length > 0) {
                        const info = this.files.shift();
                        this.gameServerSocket.write(this.generateFile(info.index, info.file));
                    }
                }
                break;
            default:
                break;
        }

        return Promise.resolve(undefined);
    }

    private generateFile(index: number, file: number): Buffer {
        let cacheFile: ByteBuffer;

        if(index === 255 && file === 255) {
            cacheFile = new ByteBuffer(crcTable.length);
            crcTable.copy(cacheFile, 0, 0);
        } else {
            cacheFile = cache.getRawFile(index, file);
        }

        if(!cacheFile || cacheFile.length === 0) {
            throw new Error(`Cache file not found; file(${file}) with index(${index}).`);
        }

        const buffer = new ByteBuffer((cacheFile.length - 2) + ((cacheFile.length - 2) / 511) + 8);
        buffer.put(index, 'BYTE');
        buffer.put(file, 'SHORT');

        let length: number = ((cacheFile.at(1, 'UNSIGNED') << 24) + (cacheFile.at(2, 'UNSIGNED') << 16) +
            (cacheFile.at(3, 'UNSIGNED') << 8) + cacheFile.at(4, 'UNSIGNED')) + 9;
        if(cacheFile.at(0) === 0) {
            length -= 4;
        }

        let c = 3;
        for(let i = 0; i < length; i++) {
            if(c === 512) {
                buffer.put(255, 'BYTE');
                c = 1;
            }

            buffer.put(cacheFile.at(i), 'BYTE');
            c++;
        }

        return Buffer.from(buffer.flipWriter());
    }

}

const socketError = (socket: Socket, error): void => {
    logger.error('Socket destroyed due to connection error.');
    logger.error(error?.message || '[no message]');
    socket.destroy();
};

const registerSocket = (socket: Socket): void => {
    socket.setNoDelay(true);
    socket.setKeepAlive(true);
    socket.setTimeout(30000);

    const connection: UpdateServerConnection = new UpdateServerConnection(socket);

    logger.info(`Updateserver connection established.`);

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

    socket.on('error', error => socketError(socket, error));
};

export const openUpdateServer = (host: string, port: number): void => {
    generateCrcTable();
    createServer(socket => registerSocket(socket)).listen(port, host);
    logger.info(`Updateserver listening @ ${ host }:${ port }.`);
};

