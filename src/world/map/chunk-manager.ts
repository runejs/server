import { Chunk } from './chunk';
import { Position } from '../position';
import { gameCache } from '../../game-server';
import { logger } from '@runejs/logger';
import { LandscapeObject } from '@runejs/cache-parser';

/**
 * Controls all of the game world's map chunks.
 */
export class ChunkManager {

    private readonly chunkMap: Map<string, Chunk>;

    public constructor() {
        this.chunkMap = new Map<string, Chunk>();
    }

    public deleteRemovedObjectMarker(object: LandscapeObject, position: Position, chunk: Chunk): void {
        chunk.removedLandscapeObjects.delete(`${position.x},${position.y},${object.objectId}`);
    }

    public removeLandscapeObject(object: LandscapeObject, position: Position): Promise<void> {
        const chunk = this.getChunkForWorldPosition(position);
        chunk.removeObject(object, position);

        return new Promise(resolve => {
            const nearbyPlayers = this.getSurroundingChunks(chunk).map(chunk => chunk.players).flat();

            nearbyPlayers.forEach(player => {
                player.packetSender.removeLandscapeObject(object, position);
            });

            resolve();
        });
    }

    public addLandscapeObject(object: LandscapeObject, position: Position): Promise<void> {
        const chunk = this.getChunkForWorldPosition(position);
        chunk.addObject(object, position);

        return new Promise(resolve => {
            const nearbyPlayers = this.getSurroundingChunks(chunk).map(chunk => chunk.players).flat();

            nearbyPlayers.forEach(player => {
                player.packetSender.setLandscapeObject(object, position);
            });

            resolve();
        });
    }

    public generateCollisionMaps(): void {
        logger.info('Generating game world collision maps...');

        const tileList = gameCache.mapRegions.mapRegionTileList;

        for(const tile of tileList) {
            const position = new Position(tile.x, tile.y, tile.level);
            const chunk = this.getChunkForWorldPosition(position);
            chunk.addTile(tile, position);
        }

        const objectList = gameCache.mapRegions.landscapeObjectList;

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
