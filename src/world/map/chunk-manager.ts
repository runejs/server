import { Chunk } from './chunk';
import { Position } from '../position';
import { logger } from '@runejs/logger';
import { cache } from '@server/game-server';

/**
 * Controls all of the game world's map chunks.
 */
export class ChunkManager {

    private readonly chunkMap: Map<string, Chunk>;
    private _complete: boolean = false;

    public constructor() {
        this.chunkMap = new Map<string, Chunk>();
    }

    public generateCollisionMaps(): void {
        logger.info('Generating game world collision maps...');

        const tileList = cache.mapData.tiles;

        for(const tile of tileList) {
            const position = new Position(tile.x, tile.y, tile.level);
            const chunk = this.getChunkForWorldPosition(position);
            chunk.addTile(tile, position);
        }

        const objectList = cache.mapData.locationObjects;

        for(const locationObject of objectList) {
            const position = new Position(locationObject.x, locationObject.y, locationObject.level);
            const chunk = this.getChunkForWorldPosition(position);
            chunk.setCacheLocationObject(locationObject, position);
        }

        logger.info('Game world collision maps generated.', true);
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
