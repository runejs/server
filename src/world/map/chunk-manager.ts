import { Chunk } from './chunk';
import { Position } from '../position';
import { gameCache377 } from '../../game-server';
import { logger } from '@runejs/logger';
import { LandscapeObject } from '@runejs/cache-parser';
import { Item } from '@server/world/items/item';
import { Player } from '@server/world/actor/player/player';
import { WorldItem } from '@server/world/items/world-item';
import { World } from '@server/world/world';

/**
 * Controls all of the game world's map chunks.
 */
export class ChunkManager {

    private readonly chunkMap: Map<string, Chunk>;

    public constructor() {
        this.chunkMap = new Map<string, Chunk>();
    }

    public generateCollisionMaps(): void {
        logger.info('Generating game world collision maps...');

        const tileList = gameCache377.mapRegions.mapRegionTileList;

        for(const tile of tileList) {
            const position = new Position(tile.x, tile.y, tile.level);
            const chunk = this.getChunkForWorldPosition(position);
            chunk.addTile(tile, position);
        }

        const objectList = gameCache377.mapRegions.landscapeObjectList;

        for(const landscapeObject of objectList) {
            const position = new Position(landscapeObject.x, landscapeObject.y, landscapeObject.level);
            const chunk = this.getChunkForWorldPosition(position);
            chunk.setCacheLandscapeObject(landscapeObject, position);
        }

        logger.info('Game world collision maps generated.', true);
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
