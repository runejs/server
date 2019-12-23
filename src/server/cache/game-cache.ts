import { readFileSync } from 'fs';
import { join } from 'path';
import { gunzipSync } from 'zlib';
import { RsBuffer } from '../net/rs-buffer';
import { CacheArchive } from './cache-archive';
import { CacheIndices } from './cache-indices';
import { ItemDefinition, parseItemDefinitions } from './definitions/item-definitions';
import { CacheMapRegions } from './map-regions/cache-map-regions';

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
    public readonly cacheIndices: CacheIndices;
    public readonly definitionArchive: CacheArchive;
    public readonly versionListArchive: CacheArchive;
    public readonly itemDefinitions: Map<number, ItemDefinition>;
    public readonly mapRegions: CacheMapRegions;

    public constructor() {
        this.dataFile = new RsBuffer(readFileSync(join(__dirname, '../../../cache/main_file_cache.dat')));

        for(let i = 0; i < INDEX_FILE_COUNT; i++) {
            this.indexFiles.push(new RsBuffer(readFileSync(join(__dirname, `../../../cache/main_file_cache.idx${i}`))));
        }

        this.definitionArchive = new CacheArchive(this.getCacheFile(0, 2));
        this.versionListArchive = new CacheArchive(this.getCacheFile(0, 5));

        this.cacheIndices = new CacheIndices(this.definitionArchive, this.versionListArchive);

        this.itemDefinitions = parseItemDefinitions(this.cacheIndices.itemDefinitionIndices, this.definitionArchive);

        this.mapRegions = new CacheMapRegions();
        this.mapRegions.parseMapRegions(this.cacheIndices.mapRegionIndices, this);

        console.info('');
    }

    public unzip(cacheFile: CacheFile): RsBuffer {
        const unzippedBuffer = gunzipSync(cacheFile.data.getBuffer());
        return new RsBuffer(unzippedBuffer);
    }

    public getCacheFile(cacheId: number, fileId: number) {
        const indexFile = this.indexFiles[cacheId];
        cacheId++;

        const index = indexFile.getSlice(INDEX_SIZE * fileId, INDEX_SIZE);
        const fileSize = (index.readUnsignedByte() << 16) | (index.readUnsignedByte() << 8) | index.readUnsignedByte();
        const fileBlock = (index.readUnsignedByte() << 16) | (index.readUnsignedByte() << 8) | index.readUnsignedByte();

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
            let nextFileId = block.readUnsignedShortBE();
            let currentPartId = block.readUnsignedShortBE();
            let nextBlockId = (block.readUnsignedByte() << 16) | (block.readUnsignedByte() << 8) | block.readUnsignedByte();
            let nextCacheId = block.readUnsignedByte();

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
