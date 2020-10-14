import { Socket } from 'net';
import { openServer, SocketConnectionHandler } from '@server/net/server-handler';
import { ByteBuffer } from '@runejs/byte-buffer';
import { parseServerConfig } from '@server/world/config/server-config';
import { logger } from '@runejs/logger/dist/logger';
import { cache, crcTable } from '@server/game-server';

enum ConnectionStage {
    HANDSHAKE = 'handshake',
    ACTIVE = 'active'
}

class UpdateServerConnection extends SocketConnectionHandler {

    private connectionStage: ConnectionStage = ConnectionStage.HANDSHAKE;
    private files: { file: number, index: number }[] = [];

    public constructor(private readonly gameServerSocket: Socket) {
        super();
    }

    public async dataReceived(buffer: ByteBuffer): Promise<void> {
        if(!buffer) {
            logger.info('No data supplied in message to updateserver.');
            return;
        }

        switch(this.connectionStage) {
            case ConnectionStage.HANDSHAKE:
                const gameVersion = buffer.get('INT');
                const outputBuffer = new ByteBuffer(1);

                if(gameVersion === 435) {
                    outputBuffer.put(6);
                    this.connectionStage = ConnectionStage.ACTIVE;
                    this.gameServerSocket.write(outputBuffer);
                } else {
                    outputBuffer.put(0);
                    this.gameServerSocket.write(outputBuffer);
                    this.gameServerSocket.destroy();
                }
                break;
            default:
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

export const createUpdateServerConnection =
    (socket: Socket): UpdateServerConnection => new UpdateServerConnection(socket);

export const launchUpdateServer = (): void => {
    const serverConfig = parseServerConfig();

    if(!serverConfig) {
        logger.error('Unable to start updateserver due to missing or invalid server configuration.');
        return;
    }

    openServer(serverConfig.updateServerHost, serverConfig.updateServerPort, 'update_server');
};
