import { Chunk } from './chunk';
import { Position } from '../position';
import { logger } from '@runejs/core';
import { filestore } from '@engine/game-server';
import { LandscapeObject, Region } from '@runejs/filestore';


export class Tile {

    public settings: number;
    public nonWalkable: boolean;
    public bridge: boolean;

    public constructor(public x: number, public y: number, public level: number, settings?: number) {
        if(settings) {
            this.setSettings(settings);
        }
    }

    public setSettings(settings: number): void {
        this.settings = settings;
        this.nonWalkable = (this.settings & 0x1) == 0x1;
        this.bridge = (this.settings & 0x2) == 0x2;
    }

}

export interface MapRegion {
    tiles: Tile[];
    objects: LandscapeObject[];
}


/**
 * Controls all of the game world's map chunks.
 */
export class ChunkManager {

    public readonly regionMap: Map<string, MapRegion> = new Map<string, MapRegion>();
    public readonly tileMap: Map<string, Tile> = new Map<string, Tile>();
    private readonly chunkMap: Map<string, Chunk>;

    public constructor() {
        this.chunkMap = new Map<string, Chunk>();
    }

    public registerMapRegion(mapRegionX: number, mapRegionY: number): void {
        const key = `${mapRegionX},${mapRegionY}`;

        if(this.regionMap.has(key)) {
            // Map region already registered
            return;
        }

        this.regionMap.set(key, { tiles: [], objects: [] });

        let region: MapRegion; // MapRegion wrapper used by the game engine
        let regionFile: Region;
        try {
            regionFile = filestore.regionStore.getRegion(mapRegionX, mapRegionY);
        } catch(error) {
            logger.error(`Error decoding map region ${mapRegionX},${mapRegionY}`);
            logger.error(error);
        }

        region = { tiles: new Array(64 * 64 * 4),
            objects: regionFile?.landscapeFile?.landscapeObjects || [] };
        if(regionFile?.mapFile) {
            // Parse map tiles for game engine use

            let tileIndex: number = 0;
            for(let level = 0; level < 4; level++) {
                for(let x = 0; x < 64; x++) {
                    for(let y = 0; y < 64; y++) {
                        const tileSettings = regionFile.mapFile.tileSettings[level][x][y];
                        region.tiles[tileIndex++] = new Tile(x, y, level, tileSettings);
                    }
                }
            }
        }

        this.regionMap.set(key, region);
        this.registerTiles(region.tiles);
        this.registerObjects(region.objects);
    }

    public registerTiles(tiles: Tile[]): void {
        if(!tiles || tiles.length === 0) {
            return;
        }

        for(const tile of tiles) {
            const key = `${tile.x},${tile.y},${tile.level}`;

            if(tile.bridge) {
                // Move this tile down one level if it's a bridge tile
                const newTile = new Tile(tile.x, tile.y, tile.level - 1);
                newTile.nonWalkable = false;
                newTile.bridge = false;
                this.tileMap.set(`${newTile.x},${newTile.y},${newTile.level}`, newTile);

                // And also add the bridge tile itself, so that game objects know about it
                this.tileMap.set(key, tile);
            } else if(tile.nonWalkable) { // No need to know about walkable tiles for collision maps, only nonwalkable
                if(!this.tileMap.has(key)) {
                    // Otherwise add a new tile if it hasn't already been set (IE by a bridge tile above)
                    this.tileMap.set(key, tile);
                }
            }
        }
    }

    public registerObjects(objects: LandscapeObject[]): void {
        if(!objects || objects.length === 0) {
            return;
        }

        for(const locationObject of objects) {
            const position = new Position(locationObject.x, locationObject.y, locationObject.level);

            const tile = this.tileMap.get(position.key);
            if(tile?.bridge) {
                // Object is on a bridge tile, move it down a level to create proper collision maps
                position.level -= 1;
            }

            const tileAbove = this.tileMap.get(`${locationObject.x},${locationObject.y},${locationObject.level + 1}`);
            if(tileAbove?.bridge) {
                // Object is below a bridge tile, move it down a level to create proper collision maps
                position.level -= 1;
            }

            this.getChunkForWorldPosition(position).setFilestoreLandscapeObject(locationObject);
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
            return chunk;
        }
    }

}
