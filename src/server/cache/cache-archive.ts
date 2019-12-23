import { CacheFile } from './game-cache';
import { RsBuffer } from '../net/rs-buffer';
const seekBzip = require('seek-bzip');

export interface ArchiveFile {
    nameHash: number;
    uncompressedSize: number;
    compressedSize: number;
    offset: number;
}

export class CacheArchive {

    private _compressed: boolean = false;
    private _namedFiles: Map<number, ArchiveFile> = new Map<number, ArchiveFile>();
    private data: RsBuffer;

    public constructor(cacheFile: CacheFile) {
        let buffer = cacheFile.data;
        buffer.setReaderIndex(0);

        const uncompressed = (buffer.readUnsignedByte() << 16) | (buffer.readUnsignedByte() << 8) | buffer.readUnsignedByte();
        const compressed = (buffer.readUnsignedByte() << 16) | (buffer.readUnsignedByte() << 8) | buffer.readUnsignedByte();

        if(uncompressed !== compressed) {
            const compressedData = buffer.getUnreadData();
            buffer = this.decompress(new RsBuffer(compressedData));
            this._compressed = true;
        }

        const dataSize = buffer.readShortBE() & 0xffff;
        let offset = buffer.getReaderIndex() + dataSize * 10;
        for(let i = 0; i < dataSize; i++) {
            const nameHash = buffer.readIntBE();
            const uncompressedSize = (buffer.readUnsignedByte() << 16) | (buffer.readUnsignedByte() << 8) | buffer.readUnsignedByte();
            const compressedSize = (buffer.readUnsignedByte() << 16) | (buffer.readUnsignedByte() << 8) | buffer.readUnsignedByte();
            const archiveFile: ArchiveFile = {
                nameHash, uncompressedSize, compressedSize, offset
            };

            this._namedFiles.set(nameHash, archiveFile);
            offset += compressedSize;
        }

        this.data = buffer;
    }

    private decompress(data: RsBuffer): RsBuffer {
        const buffer = Buffer.alloc(data.getBuffer().length + 4);
        data.getBuffer().copy(buffer, 4);
        buffer[0] = 'B'.charCodeAt(0);
        buffer[1] = 'Z'.charCodeAt(0);
        buffer[2] = 'h'.charCodeAt(0);
        buffer[3] = '1'.charCodeAt(0);

        return new RsBuffer(seekBzip.decode(buffer));
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
            while(hash < -INT_MAX) {
                const diff = Math.abs(hash) - INT_MAX;
                hash = INT_MAX - diff;
            }
        }

        return hash;
    }

    public getFileData(fileName: string): RsBuffer {
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
