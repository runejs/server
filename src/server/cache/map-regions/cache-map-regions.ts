import { MapRegionIndex } from '../cache-indices';
import { GameCache } from '../game-cache';
import { RsBuffer } from '../../net/rs-buffer';
import { logger } from '@runejs/logger';

export class MapRegionTile {

    public bridge: boolean;
    public nonWalkable: boolean;

    public constructor(public x: number, public y: number, public level: number, public flags: number) {
        this.bridge = (flags & 0x2) == 0x2;
        this.nonWalkable = (flags & 0x1) == 0x1;
    }

}

export interface LandscapeObject {
    objectId: number;
    x: number;
    y: number;
    level: number;
    type: number;
    rotation: number;
}

export class CacheMapRegions {

    private readonly _mapRegionTileList: MapRegionTile[];
    private readonly _landscapeObjectList: LandscapeObject[];

    public constructor() {
        this._mapRegionTileList = [];
        this._landscapeObjectList = [];
    }

    public parseMapRegions(mapRegionIndices: MapRegionIndex[], gameCache: GameCache): void {
        logger.info('Parsing map regions...');

        mapRegionIndices.forEach(mapRegionIndex => {
            const mapRegionX = ((mapRegionIndex.id >> 8) & 0xff) * 64;
            const mapRegionY = (mapRegionIndex.id & 0xff) * 64;
            const mapRegionBuffer = gameCache.unzip(gameCache.getCacheFile(4, mapRegionIndex.mapRegionFileId));
            const landscapeBuffer = gameCache.unzip(gameCache.getCacheFile(4, mapRegionIndex.landscapeFileId));

            for(let level = 0; level < 4; level++) {
                for(let x = 0; x < 64; x++) {
                    for(let y = 0; y < 64; y++) {
                        const mapRegionTile = this.parseTile(x + mapRegionX, y + mapRegionY, level, mapRegionBuffer);

                        // Map regions with a flag of 0 are left out since there are so many and it's useless to keep track of them.
                        // We'll let the game work chunks generate those on their own when/if needed for path validation.
                        if(mapRegionTile.flags > 0) {
                            this._mapRegionTileList.push(mapRegionTile);
                        }
                    }
                }
            }

            this.parseLandscape(landscapeBuffer, mapRegionX, mapRegionY);
        });

        logger.info(`Parsed ${this._mapRegionTileList.length} map region tiles and ${this._landscapeObjectList.length} landscape objects.`);
    }

    private parseLandscape(buffer: RsBuffer, mapRegionX: number, mapRegionY: number): void {
        let objectId = -1;

        while(true) {
            const objectIdOffset = buffer.readSmart();

            if(objectIdOffset === 0) {
                break;
            }

            objectId += objectIdOffset;
            let objectPositionInfo = 0;

            while(true) {
                const objectPositionInfoOffset = buffer.readSmart();

                if(objectPositionInfoOffset === 0) {
                    break;
                }

                objectPositionInfo += objectPositionInfoOffset - 1;

                const x = (objectPositionInfo >> 6 & 0x3f) + mapRegionX;
                const y = (objectPositionInfo & 0x3f) + mapRegionY;
                const level = objectPositionInfo >> 12;
                const objectMetadata = buffer.readUnsignedByte();
                const type = objectMetadata >> 2;
                const rotation = objectMetadata & 3;

                this._landscapeObjectList.push({ objectId, x, y, level, type, rotation });
            }
        }
    }

    private parseTile(x: number, y: number, level: number, buffer: RsBuffer): MapRegionTile {
        let flags = 0;

        while(true) {
            const opcode = buffer.readByte() & 0xff;

            if(opcode === 0) {
                return new MapRegionTile(x, y, level, flags);
            } else if(opcode === 1) {
                buffer.readByte(); // ???
                return new MapRegionTile(x, y, level, flags);
            } else if(opcode <= 49) {
                buffer.readByte(); // ???
            } else if(opcode <= 81) {
                flags = opcode - 49;
            }
        }
    }

    public get mapRegionTileList(): MapRegionTile[] {
        return this._mapRegionTileList;
    }

    public get landscapeObjectList(): LandscapeObject[] {
        return this._landscapeObjectList;
    }
}
