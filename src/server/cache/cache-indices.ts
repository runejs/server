import { CacheArchive } from './cache-archive';
import { RsBuffer } from '../net/rs-buffer';

export interface DefinitionIndex {
    id: number;
    offset: number;
}

export class CacheIndices {

    private _itemDefinitionIndices: DefinitionIndex[];

    public constructor(private readonly archive: CacheArchive) {
        this.parseItemDefinitionIndices();
    }

    private parseItemDefinitionIndices(): void {
        const buffer: RsBuffer = this.archive.getFileData('obj.idx');
        const indexCount = buffer.readUnsignedShortBE();
        const indices: DefinitionIndex[] = new Array(indexCount);
        let offset = 2;

        for(let id = 0; id < indexCount; id++) {
            indices[id] = { id, offset };
            offset += buffer.readUnsignedShortBE();
        }

        this._itemDefinitionIndices = indices;
    }

    public get itemDefinitionIndices(): DefinitionIndex[] {
        return this._itemDefinitionIndices;
    }
}
