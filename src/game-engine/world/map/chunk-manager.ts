import { Chunk } from './chunk';
import { Position } from '../position';
import { logger } from '@runejs/core';
import { filestore } from '@engine/game-server';
import { LandscapeFile, LandscapeObject, MapFile } from '@runejs/filestore';


export class Tile {

    public settings: number = 0;
    public blocked: boolean = false;
    public bridge: boolean = false;

    public constructor(public x: number, public y: number, public level: number, settings?: number) {
        if(settings) {
            this.setSettings(settings);
        }
    }

    public setSettings(settings: number): void {
        this.settings = settings;
        this.blocked = (this.settings & 0x1) === 1;
        this.bridge = (this.settings & 0x2) === 2;
    }

}

export interface MapRegion {
    objects: LandscapeObject[];
    mapFile: MapFile;
}


/**
 * Controls all of the game world's map chunks.
 */
export class ChunkManager {

    public readonly regionMap: Map<string, MapRegion> = new Map<string, MapRegion>();
    private readonly chunkMap: Map<string, Chunk>;

    public constructor() {
        this.chunkMap = new Map<string, Chunk>();
    }

    public getTile(position: Position): Tile {
        const chunkX = position.chunkX + 6;
        const chunkY = position.chunkY + 6;
        const mapRegionX = Math.floor(chunkX / 8);
        const mapRegionY = Math.floor(chunkY / 8);
        const mapWorldPositionX = (mapRegionX & 0xff) * 64;
        const mapWorldPositionY = mapRegionY * 64;
        const regionSettings = this.regionMap.get(`${mapRegionX},${mapRegionY}`)?.mapFile?.tileSettings;

        this.registerMapRegion(mapRegionX, mapRegionY);

        if(!regionSettings) {
            return new Tile(position.x, position.y, position.level);
        }

        const tileX = position.x - mapWorldPositionX;
        const tileY = position.y - mapWorldPositionY;
        const tileLevel = position.level;
        let tileSettings = regionSettings[tileLevel][tileX][tileY];

        if(tileLevel < 3) {
            // Check for a bridge tile above the active tile
            const tileAboveSettings = regionSettings[tileLevel + 1][tileX][tileY];
            if((tileAboveSettings & 0x2) === 2) {
                // Set this tile as walkable if the tile above is a bridge -
                // This is because the maps are stored with bridges being one level
                // above where their collision maps need to be
                tileSettings = 0;
            }
        }

        return new Tile(position.x, position.y, tileLevel, tileSettings);
    }

    public registerMapRegion(mapRegionX: number, mapRegionY: number): void {
        const key = `${mapRegionX},${mapRegionY}`;

        if(this.regionMap.has(key)) {
            // Map region already registered
            return;
        }
        this.regionMap.set(key, null);

        let mapFile: MapFile;
        let landscapeFile: LandscapeFile;

        try {
            mapFile = filestore.regionStore.getMapFile(mapRegionX, mapRegionY);
        } catch(error) {
            logger.error(`Error decoding map file ${mapRegionX},${mapRegionY}`);
        }
        try {
            landscapeFile = filestore.regionStore.getLandscapeFile(mapRegionX, mapRegionY);
        } catch(error) {
            logger.error(`Error decoding landscape file ${mapRegionX},${mapRegionY}`);
        }

        const region: MapRegion = { mapFile, objects: landscapeFile?.landscapeObjects || [] };

        this.regionMap.set(key, region);
        this.registerObjects(region.objects, mapFile);
    }

    public registerObjects(objects: LandscapeObject[], mapFile: MapFile): void {
        if(!objects || objects.length === 0) {
            return;
        }

        const mapWorldPositionX = (mapFile.regionX & 0xff) * 64;
        const mapWorldPositionY = mapFile.regionY * 64;

        for(const object of objects) {
            const position = new Position(object.x, object.y, object.level);
            const localX = object.x - mapWorldPositionX;
            const localY = object.y - mapWorldPositionY;

            for(let level = 3; level >= 0; level--) {
                if((mapFile.tileSettings[level][localX][localY] & 0x2) === 2) {
                    // Object is on or underneath a bridge tile and needs to move down one level
                    position.move(object.x, object.y, object.level - 1);
                }
            }

            this.getChunkForWorldPosition(position).setFilestoreLandscapeObject(object);
        }
    }

    public getSurroundingChunks(chunk: Chunk): Chunk[] {
        const chunks: Chunk[] = [];

        const mainX = chunk.position.x;
        const mainY = chunk.position.y;
        const level = chunk.position.level;

        for(let x = mainX - 2; x <= mainX + 2; x++) {
            for(let y = mainY - 2; y <= mainY + 2; y++) {
                chunks.push(this.getChunk({ x, y, level }));
            }
        }

        return chunks;
    }

    /**
     * Given a world Position, return the region ID that it is contained within.
     * @param position The position to use
     */
    public getRegionIdForWorldPosition(position: Position): number {
        return ((position.x >> 6) << 8) + (position.y >> 6);
    }

    public getChunkForWorldPosition(position: Position): Chunk {
        return this.getChunk({ x: position.chunkX, y: position.chunkY, level: position.level });
    }

    public getChunk(position: Position | { x: number, y: number, level: number }): Chunk {
        if(!(position instanceof Position)) {
            position = new Position(position.x, position.y, position.level);
        }

        const pos = (position as Position);
        if(this.chunkMap.has(pos.key)) {
            return this.chunkMap.get(pos.key);
        } else {
            const chunk = new Chunk(pos);
            this.chunkMap.set(pos.key, chunk);
            chunk.registerMapRegion();
            return chunk;
        }
    }

}
