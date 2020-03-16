import { RsBuffer } from '@server/net/rs-buffer';
import { DataParser } from './data-parser';
import { crcTable, gameCache } from '@server/game-server';

/**
 * Handles the cache update server.
 */
export class UpdateServerParser extends DataParser {

    private files: { file: number, index: number }[] = [];

    public parse(buffer?: RsBuffer): void {
        if(!buffer) {
            return;
        }

        while(buffer.getReadable() >= 4) {
            const type = buffer.readUnsignedByte();
            const index = buffer.readUnsignedByte();
            const file = buffer.readUnsignedShortBE();

            switch(type) {
                case 0: // queue
                    this.files.push({ index, file });
                    break;
                case 1: // immediate
                    this.clientConnection.socket.write(this.generateFile(index, file));
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
                this.clientConnection.socket.write(this.generateFile(info.index, info.file));
            }
        }
    }

    private generateFile(index: number, file: number): Buffer {
        let cacheFile;

        if(index === 255 && file === 255) {
            const crcBuffer = Buffer.alloc(crcTable.length);
            crcTable.copy(crcBuffer, 0, 0);
            cacheFile = new RsBuffer(crcBuffer);
        } else {
            cacheFile = gameCache.getRawCacheFile(index, file);
        }

        if(!cacheFile || cacheFile.getBuffer().length === 0) {
            throw `Cache file not found; file(${file}) with index(${index})`;
        }

        const cacheFileBuffer = cacheFile.getBuffer();

        const buffer = RsBuffer.create((cacheFileBuffer.length - 2) + ((cacheFileBuffer.length - 2) / 511) + 8);
        buffer.writeUnsignedByte(index);
        buffer.writeUnsignedShortBE(file);

        let length: number = ((cacheFileBuffer.readUInt8(1) << 24) + (cacheFileBuffer.readUInt8(2) << 16) +
            (cacheFileBuffer.readUInt8(3) << 8) + cacheFileBuffer.readUInt8(4)) + 9;
        if(cacheFileBuffer[0] == 0) {
            length -= 4;
        }

        let c = 3;
        for(let i = 0; i < length; i++) {
            if(c == 512) {
                buffer.writeUnsignedByte(255);
                c = 1;
            }

            buffer.writeByte(cacheFileBuffer.readInt8(i));
            c++;
        }

        return buffer.getData();
    }
}
