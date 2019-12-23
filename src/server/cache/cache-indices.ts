import { CacheArchive } from './cache-archive';
import { RsBuffer } from '../net/rs-buffer';
import { logger } from '@runejs/logger';

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
    private _landscapeObjectDefinitionIndices: DefinitionIndex[];
    private _mapRegionIndices: MapRegionIndex[];

    public constructor(private readonly definitionArchive: CacheArchive, private readonly versionListArchive: CacheArchive) {
        this.parseItemDefinitionIndices();
        this.parseLandscapeObjectDefinitionIndices();
        this.parseMapRegionIndices();
    }

    private parseLandscapeObjectDefinitionIndices(): void {
        logger.info('Parsing landscape object definition indices...');

        this._landscapeObjectDefinitionIndices = this.parseDefinitionIndices('loc.idx');

        logger.info(`${this._landscapeObjectDefinitionIndices.length} landscape objects found within the game cache.`);
    }

    private parseItemDefinitionIndices(): void {
        logger.info('Parsing item definition indices...');

        this._itemDefinitionIndices = this.parseDefinitionIndices('obj.idx');

        logger.info(`${this._itemDefinitionIndices.length} items found within the game cache.`);
    }

    private parseDefinitionIndices(fileName: string): DefinitionIndex[] {
        const buffer: RsBuffer = this.definitionArchive.getFileData(fileName);
        const indexCount = buffer.readUnsignedShortBE();
        const indices: DefinitionIndex[] = new Array(indexCount);
        let offset = 2;

        for(let id = 0; id < indexCount; id++) {
            indices[id] = { id, offset };
            offset += buffer.readUnsignedShortBE();
        }

        return indices;
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

    public get landscapeObjectDefinitionIndices(): DefinitionIndex[] {
        return this._landscapeObjectDefinitionIndices;
    }

    public get mapRegionIndices(): MapRegionIndex[] {
        return this._mapRegionIndices;
    }
}
