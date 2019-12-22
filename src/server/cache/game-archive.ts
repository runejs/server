import { CacheFile } from './game-cache';
import { RsBuffer } from '../net/rs-buffer';
const seekBzip = require('seek-bzip');

export interface ArchiveFile {
    nameHash: number;
    uncompressedSize: number;
    compressedSize: number;
    offset: number;
}

export class GameArchive {

    private _compressed: boolean = false;
    private _namedFiles: Map<number, ArchiveFile> = new Map<number, ArchiveFile>();
    private data: RsBuffer;

    public constructor(cacheFile: CacheFile) {
        const buffer = cacheFile.data;
        buffer.setReaderIndex(0);

        const uncompressed = ((buffer.readByte() & 0xff) << 16) | ((buffer.readByte() & 0xff) << 8) | (buffer.readByte() & 0xff);
        const compressed = ((buffer.readByte() & 0xff) << 16) | ((buffer.readByte() & 0xff) << 8) | (buffer.readByte() & 0xff);

        if(uncompressed !== compressed) {
            const compressedData = new RsBuffer(buffer.getUnreadData());
            // @TODO
        }

        const dataSize = buffer.readShortBE() & 0xffff;
        let offset = buffer.getReaderIndex() + dataSize * 10;
        for(let i = 0; i < dataSize; i++) {
            const nameHash = buffer.readIntBE();
            const uncompressedSize = ((buffer.readByte() & 0xFF) << 16) | ((buffer.readByte() & 0xFF) << 8) | (buffer.readByte() & 0xFF);
            const compressedSize = ((buffer.readByte() & 0xFF) << 16) | ((buffer.readByte() & 0xFF) << 8) | (buffer.readByte() & 0xFF);
            const archiveFile: ArchiveFile = {
                nameHash, uncompressedSize, compressedSize, offset
            };
            this._namedFiles.set(nameHash, archiveFile);
            offset += compressedSize;
        }

        this.data = buffer;
    }

    private decompress(data: RsBuffer): any {
        const buffer = Buffer.alloc(data.getBuffer().length + 4);
        data.getBuffer().copy(buffer, 4);
        buffer[0] = 'B'.charCodeAt(0);
        buffer[1] = 'Z'.charCodeAt(0);
        buffer[2] = 'h'.charCodeAt(0);
        buffer[3] = '1'.charCodeAt(0);

        return seekBzip.decode(buffer);
    }

    private hashFileName(fileName: string): number {
        const INT_MAX = 2147483648;
        let hash = 0;
        fileName = fileName.toUpperCase();
        for(let i = 0; i < fileName.length; i++) {
            hash = hash * 61 + fileName.charCodeAt(i) - 32;

            // Emulate Java's INT overflow-wrapping
            while(hash > INT_MAX) {
                const diff = hash - INT_MAX;
                hash = -INT_MAX + diff;
            }
        }

        return hash;
    }

    public getFile(fileName: string): RsBuffer {
        const nameHash = this.hashFileName(fileName);
        const archiveFile = this._namedFiles.get(nameHash);

        if(archiveFile === null || archiveFile === undefined) {
            return null;
        } else {
            const data = Buffer.alloc(archiveFile.compressedSize);
            this.data.getBuffer().copy(data, 0, archiveFile.offset);
            const buffer = new RsBuffer(data);
            if(this.compressed) {
                return buffer;
            } else {
                return this.decompress(buffer);
            }
        }
    }

    public get compressed(): boolean {
        return this._compressed;
    }

    public get namedFiles(): Map<number, ArchiveFile> {
        return this._namedFiles;
    }
}
