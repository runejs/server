import { LocationObject } from '@runejs/cache-parser';
import { Position } from '@server/world/position';
import { world } from '@server/game-server';

/**
 * Modifications made to a single game world map chunk.
 */
interface ChunkMod {
    spawnedObjects?: LocationObject[];
    hiddenObjects?: LocationObject[];
}

/**
 * A player or group instance within the world.
 */
export class PlayerInstance {

    public readonly instanceId: string;
    public readonly chunkModifications: Map<string, Map<string, ChunkMod>> = new Map<string, Map<string, ChunkMod>>();

    public constructor(instanceId: string = null) {
        this.instanceId = instanceId;
    }

    /**
     * Spawn a new game object into the instance.
     * @param object The game object to spawn.
     */
    public spawnGameObject(object: LocationObject): void {
        const position = new Position(object.x, object.y, object.level);
        const chunkMap = this.getChunk(position);

        let chunkMod: ChunkMod = {};
        if(chunkMap.has(position.key)) {
            chunkMod = chunkMap.get(position.key);
        }

        if(!chunkMod.spawnedObjects) {
            chunkMod.spawnedObjects = [];
        }

        chunkMod.spawnedObjects.push(object);

        chunkMap.set(position.key, chunkMod);
    }

    /**
     * Remove a previously spawned game object from the game.
     * @param object The game object to de-spawn.
     */
    public despawnGameObject(object: LocationObject): void {
        const position = new Position(object.x, object.y, object.level);
        const chunkMap = this.getChunk(position);

        if(!chunkMap.has(position.key)) {
            // Object no longer exists
            return;
        }

        const chunkMod = chunkMap.get(position.key);
        if(chunkMod.spawnedObjects && chunkMod.spawnedObjects.length !== 0) {
            const idx = chunkMod.spawnedObjects.findIndex(o => o.objectId === object.objectId &&
                o.type === object.type && o.orientation === object.orientation);
            if(idx !== -1) {
                chunkMod.spawnedObjects.splice(idx, 1);
            }
        }

        if(chunkMod.spawnedObjects.length === 0) {
            delete chunkMod.spawnedObjects;
        }
    }

    /**
     * Removes a static game object from the player's view.
     * @param object The cache game object to hide from view.
     */
    public hideGameObject(object: LocationObject): void {
        const position = new Position(object.x, object.y, object.level);
        const chunkMap = this.getChunk(position);

        let chunkMod: ChunkMod = {};
        if(chunkMap.has(position.key)) {
            chunkMod = chunkMap.get(position.key);
        }

        if(!chunkMod.hiddenObjects) {
            chunkMod.hiddenObjects = [];
        }

        chunkMod.hiddenObjects.push(object);

        chunkMap.set(position.key, chunkMod);
    }

    /**
     * Shows a previously hidden static game object.
     * @param object The cache game object to stop hiding from view.
     */
    public showGameObject(object: LocationObject): void {
        const position = new Position(object.x, object.y, object.level);
        const chunkMap = this.getChunk(position);

        if(!chunkMap.has(position.key)) {
            // Object no longer exists
            return;
        }

        const chunkMod = chunkMap.get(position.key);
        if(chunkMod.hiddenObjects && chunkMod.hiddenObjects.length !== 0) {
            const idx = chunkMod.hiddenObjects.findIndex(o => o.objectId === object.objectId &&
                o.type === object.type && o.orientation === object.orientation);
            if(idx !== -1) {
                chunkMod.hiddenObjects.splice(idx, 1);
            }
        }

        if(chunkMod.hiddenObjects.length === 0) {
            delete chunkMod.hiddenObjects;
        }
    }

    /**
     * Fetch a chunk modification map from this instance.
     * @param worldPosition The game world position to find the chunk for.
     */
    public getChunk(worldPosition: Position): Map<string, ChunkMod> {
        const chunkPosition = world.chunkManager.getChunkForWorldPosition(worldPosition)?.position || null;
        if(!chunkPosition) {
            // Chunk not found - fail gracefully
            return new Map<string, ChunkMod>();
        }

        if(!this.chunkModifications.has(chunkPosition.key)) {
            this.chunkModifications.set(chunkPosition.key, new Map<string, ChunkMod>());
        }

        return this.chunkModifications.get(chunkPosition.key);
    }

}
