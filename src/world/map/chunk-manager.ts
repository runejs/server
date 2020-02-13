import { Chunk } from './chunk';
import { Position } from '../position';
import { gameCache } from '../../game-server';
import { logger } from '@runejs/logger';
import { LandscapeObject } from '@runejs/cache-parser';
import { Item } from '@server/world/items/item';
import { Player } from '@server/world/mob/player/player';
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

    public spawnWorldItem(item: Item, position: Position, initiallyVisibleTo?: Player, expires?: number): void {
        const chunk = this.getChunkForWorldPosition(position);
        const worldItem: WorldItem = {
            itemId: item.itemId,
            amount: item.amount,
            position,
            initiallyVisibleTo,
            expires
        };

        chunk.addWorldItem(worldItem);

        if(initiallyVisibleTo) {
            initiallyVisibleTo.packetSender.setWorldItem(worldItem, worldItem.position);
            setTimeout(() => {
                this.spawnWorldItemForPlayers(worldItem, chunk, initiallyVisibleTo);
                worldItem.initiallyVisibleTo = undefined;
            }, 100 * World.TICK_LENGTH);
        } else {
            this.spawnWorldItemForPlayers(worldItem, chunk);
        }

        if(expires) {
            setTimeout(() => {
                chunk.removeWorldItem(worldItem);
                this.deleteWorldItemForPlayers(worldItem, chunk);
            }, expires * World.TICK_LENGTH);
        }
    }

    private spawnWorldItemForPlayers(worldItem: WorldItem, chunk: Chunk, excludePlayer?: Player): Promise<void> {
        return new Promise(resolve => {
            const nearbyPlayers = this.getSurroundingChunks(chunk).map(chunk => chunk.players).flat();

            nearbyPlayers.forEach(player => {
                if(excludePlayer && excludePlayer.equals(player)) {
                    return;
                }

                player.packetSender.setWorldItem(worldItem, worldItem.position);
            });

            resolve();
        });
    }

    private deleteWorldItemForPlayers(worldItem: WorldItem, chunk: Chunk): Promise<void> {
        return new Promise(resolve => {
            const nearbyPlayers = this.getSurroundingChunks(chunk).map(chunk => chunk.players).flat();

            nearbyPlayers.forEach(player => {
                player.packetSender.removeWorldItem(worldItem, worldItem.position);
            });

            resolve();
        });
    }

    public toggleObjects(newObject: LandscapeObject, oldObject: LandscapeObject, newPosition: Position, oldPosition: Position,
                         newChunk: Chunk, oldChunk: Chunk, newObjectInCache: boolean): void {
        if(newObjectInCache) {
            this.deleteRemovedObjectMarker(newObject, newPosition, newChunk);
            this.deleteAddedObjectMarker(oldObject, oldPosition, oldChunk);
        }

        this.addLandscapeObject(newObject, newPosition);
        this.removeLandscapeObject(oldObject, oldPosition);
    }

    public deleteAddedObjectMarker(object: LandscapeObject, position: Position, chunk: Chunk): void {
        chunk.addedLandscapeObjects.delete(`${position.x},${position.y},${object.objectId}`);
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
