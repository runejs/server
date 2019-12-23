import { CacheArchive } from './cache-archive';
import { RsBuffer } from '../net/rs-buffer';
import { logger } from '../util/logger';

export interface DefinitionIndex {
    id: number;
    offset: number;
}

export interface MapRegionIndex {
    id: number;
    mapRegionFileId: number;
    landscapeFileId: number;
    members: boolean;
}

export class CacheIndices {

    private _itemDefinitionIndices: DefinitionIndex[];
    private _mapRegionIndices: MapRegionIndex[];

    public constructor(private readonly definitionArchive: CacheArchive, private readonly versionListArchive: CacheArchive) {
        this.parseItemDefinitionIndices();
        this.parseMapRegionIndices();
    }

    private parseItemDefinitionIndices(): void {
        logger.info('Parsing item definition indices...');

        const buffer: RsBuffer = this.definitionArchive.getFileData('obj.idx');
        const indexCount = buffer.readUnsignedShortBE();
        const indices: DefinitionIndex[] = new Array(indexCount);
        let offset = 2;

        for(let id = 0; id < indexCount; id++) {
            indices[id] = { id, offset };
            offset += buffer.readUnsignedShortBE();
        }

        this._itemDefinitionIndices = indices;

        logger.info(`${indexCount} items found within the game cache.`);
    }

    private parseMapRegionIndices(): void {
        logger.info('Parsing map region indices...');

        const buffer: RsBuffer = this.versionListArchive.getFileData('map_index');
        const indexCount = Math.floor(buffer.getBuffer().length / 7);
        const indices: MapRegionIndex[] = new Array(indexCount);

        for(let i = 0; i < indexCount; i++) {
            const id = buffer.readUnsignedShortBE();
            const mapRegionFileId = buffer.readUnsignedShortBE();
            const landscapeFileId = buffer.readUnsignedShortBE();
            const members = buffer.readUnsignedByte() === 1;
            indices[i] = { id, mapRegionFileId, landscapeFileId, members };
        }

        this._mapRegionIndices = indices;

        logger.info(`${indexCount} map regions found within the game cache.`);
    }

    public get itemDefinitionIndices(): DefinitionIndex[] {
        return this._itemDefinitionIndices;
    }

    public get mapRegionIndices(): MapRegionIndex[] {
        return this._mapRegionIndices;
    }
}
