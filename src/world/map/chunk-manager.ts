import { Chunk } from './chunk';
import { Position } from '../position';
import { logger } from '@runejs/core';
import { cache, serverConfig } from '@server/game-server';
import { decodeRegion, LocationObject, Tile } from '@runejs/cache-parser';

export interface MapRegion {
    tiles: Tile[];
    objects: LocationObject[];
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

        let region: MapRegion;
        try {
            region = decodeRegion(cache, mapRegionX, mapRegionY);
        } catch(error) {
            logger.error(`Error decoding map region ${mapRegionX},${mapRegionY}`);
            logger.error(error);
        }

        if(!region) {
            region = { tiles: [], objects: [] };
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
            } else if(tile.nonWalkable && tile.flags) { // No need to know about walkable tiles for collision maps, only nonwalkable
                if(!this.tileMap.has(key)) {
                    // Otherwise add a new tile if it hasn't already been set (IE by a bridge tile above)
                    this.tileMap.set(key, tile);
                }
            }
        }
    }

    public registerObjects(objects: LocationObject[]): void {
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

            this.getChunkForWorldPosition(position).setCacheLocationObject(locationObject);
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
