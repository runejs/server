import { ByteBuffer } from '@runejs/byte-buffer';
import { DataParser } from './data-parser';

const crcTable = null;

/**
 * Handles the cache update server.
 */
export class UpdateServerParser extends DataParser {

    private files: { file: number, index: number }[] = [];

    public parse(buffer?: ByteBuffer): void {
        /*if(!buffer) {
            return;
        }

        while(buffer.readable >= 4) {
            const type = buffer.get('BYTE', 'UNSIGNED');
            const index = buffer.get('BYTE', 'UNSIGNED');
            const file = buffer.get('SHORT', 'UNSIGNED');

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
        }*/
    }

    private generateFile(index: number, file: number): void {
        /*let cacheFile: ByteBuffer;

        if(index === 255 && file === 255) {
            cacheFile = new ByteBuffer(crcTable.length);
            crcTable.copy(cacheFile, 0, 0);
        } else {
            cacheFile = cache.getRawFile(index, file);
        }

        if(!cacheFile || cacheFile.length === 0) {
            throw new Error(`Cache file not found; file(${file}) with index(${index})`);
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

        return Buffer.from(buffer.flipWriter());*/
    }
}
