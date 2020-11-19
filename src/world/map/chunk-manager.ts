import { Chunk } from './chunk';
import { Position } from '../position';
import { logger } from '@runejs/core';
import { cache, serverConfig } from '@server/game-server';
import { Tile } from '@runejs/cache-parser';

/**
 * Controls all of the game world's map chunks.
 */
export class ChunkManager {

    public readonly tileMap: Map<string, Tile> = new Map<string, Tile>();
    private readonly chunkMap: Map<string, Chunk>;
    private _complete: boolean = false;

    public constructor() {
        this.chunkMap = new Map<string, Chunk>();
    }

    public generateCollisionMaps(): void {
        if(!serverConfig.clippingDisabled) {
            const hrstart = process.hrtime();
            logger.info('Generating game world collision maps...');

            const tileList = cache.mapData.tiles;

            for(const tile of tileList) {
                const key = `${tile.x},${tile.y},${tile.level}`;

                if(tile.bridge) {
                    // Move this tile down one level if it's a bridge tile
                    const newTile = new Tile(tile.x, tile.y, tile.level - 1);
                    newTile.nonWalkable = tile.nonWalkable;
                    newTile.bridge = null;
                    this.tileMap.set(`${tile.x},${tile.y},${tile.level - 1}`, newTile);
                } else if(!this.tileMap.has(key)) {
                    // Otherwise add a new tile if it hasn't already been set (IE by a bridge tile above)
                    this.tileMap.set(key, tile);
                }
            }

            const objectList = cache.mapData.locationObjects;

            for(const locationObject of objectList) {
                const position = new Position(locationObject.x, locationObject.y, locationObject.level);
                const chunk = this.getChunkForWorldPosition(position);
                chunk.setCacheLocationObject(locationObject, position);
            }

            const hrend = process.hrtime(hrstart);
            logger.info(`Game world collision maps generated in ${hrend[1] / 1000000}ms.`);
        }

        this._complete = true;
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

    public get complete(): boolean {
        return this._complete;
    }

}
