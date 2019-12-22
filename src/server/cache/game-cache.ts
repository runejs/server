import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { RsBuffer } from '../net/rs-buffer';
import { GameArchive } from './game-archive';

const INDEX_FILE_COUNT = 5;
const INDEX_SIZE = 6;
const DATA_BLOCK_SIZE = 512;
const DATA_HEADER_SIZE = 8;
const DATA_SIZE = DATA_BLOCK_SIZE + DATA_HEADER_SIZE;

export interface CacheFile {
    cacheId: number;
    fileId: number;
    data: RsBuffer;
}

export class GameCache {

    private dataFile: RsBuffer;
    private indexFiles: RsBuffer[] = [];

    public constructor() {
        this.dataFile = new RsBuffer(readFileSync(join(__dirname, '../../../cache/main_file_cache.dat')));

        for(let i = 0; i < INDEX_FILE_COUNT; i++) {
            this.indexFiles.push(new RsBuffer(readFileSync(join(__dirname, `../../../cache/main_file_cache.idx${i}`))));
        }

        const cacheFile = this.getCacheFile(0, 2);
        console.log('cacheFile = ' + cacheFile.data.getBuffer().length);

        const archive = new GameArchive(cacheFile);
        const archiveFile = archive.getFile('obj.dat');

        //console.log('archiveFile = ' + archiveFile);
        writeFileSync(join(__dirname, '../../../cache/obj.txt'), archiveFile);
    }

    public getCacheFile(cacheId: number, fileId: number) {
        const indexFile = this.indexFiles[cacheId];
        cacheId++;

        const index = indexFile.getSlice(INDEX_SIZE * fileId, INDEX_SIZE);
        const fileSize = ((index.readByte() & 0xff) << 16) | ((index.readByte() & 0xff) << 8) | (index.readByte() & 0xff);
        const fileBlock = ((index.readByte() & 0xff) << 16) | ((index.readByte() & 0xff) << 8) | (index.readByte() & 0xff);

        let remainingBytes = fileSize;
        let currentBlock = fileBlock;

        const fileBuffer = RsBuffer.create(fileSize);
        let cycles = 0;

        while(remainingBytes > 0) {
            let size = DATA_SIZE;
            let remaining = this.dataFile.getReadable() - currentBlock * DATA_SIZE;
            if(remaining < DATA_SIZE) {
                size = remaining;
            }

            const block = this.dataFile.getSlice(currentBlock * DATA_SIZE, size);
            let nextFileId = block.readShortBE() & 0xFFFF;
            let currentPartId = block.readShortBE() & 0xFFFF;
            let nextBlockId = ((block.readByte() & 0xFF) << 16) | ((block.readByte() & 0xFF) << 8) | (block.readByte() & 0xFF);
            let nextCacheId = block.readByte() & 0xFF;

            size -= 8;

            let bytesThisCycle = remainingBytes;
            if(bytesThisCycle > DATA_BLOCK_SIZE) {
                bytesThisCycle = DATA_BLOCK_SIZE;
            }

            //fileBuffer.writeBytes(block.getBuffer().slice(block.getReaderIndex(), bytesThisCycle));
            block.getBuffer().copy(fileBuffer.getBuffer(), fileBuffer.getWriterIndex(), block.getReaderIndex(), block.getReaderIndex() + size);
            fileBuffer.setWriterIndex(fileBuffer.getWriterIndex() + bytesThisCycle);
            remainingBytes -= bytesThisCycle;

            if(cycles != currentPartId) {
                throw("Cycle does not match part id.");
            }

            if(remainingBytes > 0) {
                if(nextCacheId != cacheId) {
                    throw("Unexpected next cache id.");
                }
                if(nextFileId != fileId) {
                    throw("Unexpected next file id.");
                }
            }

            cycles++;
            currentBlock = nextBlockId;
        }

        return { cacheId, fileId, data: fileBuffer } as CacheFile;
    }

}
