import { Position } from '@engine/world/position';
import { world } from '@engine/game-server';
import { WorldItem } from '@engine/world/items/world-item';
import { Item } from '@engine/world/items/item';
import { Player } from '@engine/world/actor/player/player';
import { World } from '@engine/world/index';
import { schedule } from '@engine/world/task';
import { CollisionMap } from '@engine/world/map/collision-map';
import { LandscapeObject } from '@runejs/filestore';
import { logger } from '@runejs/core';


/**
 * Additional configuration info for an item being spawned in an instance.
 */
interface ItemSpawnConfig {

    /**
     * optional] The original owner of the spawned item.
     */
    owner?: Player;

    /**
     * optional] When the spawned item should expire and de-spawn.
     */
    expires?: number;

    /**
     * [optional] When the item should re-spawn after being picked up.
     */
    respawns?: number;
}

/**
 * A game world chunk that is tied to a specific instance.
 */
export interface InstancedChunk {

    /**
     * A specific instanced game chunk's collision map.
     */
    collisionMap: CollisionMap;

    /**
     * Tile modifications made to this instanced chunk.
     */
    mods: Map<string, TileModifications>;

}

/**
 * Modifications made to a single game tile within an instance.
 */
export class TileModifications {

    /**
     * New game objects that have been introduced to an instance.
     */
    public readonly spawnedObjects: LandscapeObject[] = [];

    /**
     * Cache/standard game objects that have been hidden from an instance.
     */
    public readonly hiddenObjects: LandscapeObject[] = [];

    /**
     * World items spawned onto this tile within an instance.
     */
    public readonly worldItems: WorldItem[] = [];

    /**
     * Checks if this tile is devoid of any modifications.
     */
    public get empty(): boolean {
        return this.spawnedObjects.length === 0 && this.hiddenObjects.length === 0 && this.worldItems.length === 0;
    }

}

/**
 * A player or group instance within the world.
 */
export class WorldInstance {

    /**
     * A list of game world chunks that have modifications made to them in this instance.
     */
    public readonly chunkModifications = new Map<string, InstancedChunk>();

    /**
     * A list of players currently in this instance.
     */
    public readonly players: Map<string, Player> = new Map<string, Player>();

    /**
     * Creates a new game world instance.
     * @param instanceId [optional] The instanceId to apply to this new world instance.
     * If not provided, the instance will be considered a public global world instance.
     */
    public constructor(public readonly instanceId: string = null) {
    }

    /**
     * Spawns a new world item in this instance.
     * @param item The item to spawn into the game world.
     * @param position The position to spawn the item at.
     * @param config Additional item spawn config.
     * If not provided, the item will stay within the instance indefinitely.
     */
    public spawnWorldItem(item: Item | number, position: Position, config?: ItemSpawnConfig): WorldItem {
        const { owner, respawns, expires } = config || {};

        if(typeof item === 'number') {
            item = { itemId: item, amount: 1 };
        }
        const worldItem: WorldItem = {
            itemId: item.itemId,
            amount: item.amount,
            position,
            owner,
            expires,
            respawns,
            instance: this
        };

        const { chunk: instancedChunk, mods } = this.getTileModifications(position);

        if(owner) {
            // If this world item is only visible to one player initially, we setup a timeout to spawn it for all other
            // players after 100 game cycles.
            try {
                owner.outgoingPackets.setWorldItem(worldItem, worldItem.position);
            } catch(error) {
                logger.error(`Error spawning world item ${worldItem?.itemId} at ${worldItem?.position?.key}`, error);
                return null;
            }
        }

        mods.worldItems.push(worldItem);
        instancedChunk.mods.set(position.key, mods);

        if(owner) {
            setTimeout(() => {
                if(worldItem.removed) {
                    return;
                }

                this.worldItemAdded(worldItem, owner);
                worldItem.owner = undefined;
            }, 100 * World.TICK_LENGTH);
        } else {
            this.worldItemAdded(worldItem);
        }

        if(expires) {
            // If the world item is set to expire, set up a timeout to remove it from the game world after the
            // specified number of game cycles.
            setTimeout(() => {
                if(worldItem.removed) {
                    return;
                }

                this.despawnWorldItem(worldItem);
            }, expires * World.TICK_LENGTH);
        }

        return worldItem;
    }

    /**
     * De-spawns a world item from this instance.
     * @param worldItem The world item to de-spawn.
     */
    public despawnWorldItem(worldItem: WorldItem): void {
        const chunkMap = this.getInstancedChunk(worldItem.position);

        if(!chunkMap.mods.has(worldItem.position.key)) {
            // Object no longer exists
            return;
        }

        const chunkMod = chunkMap.mods.get(worldItem.position.key);
        if(chunkMod.worldItems && chunkMod.worldItems.length !== 0) {
            const idx = chunkMod.worldItems.findIndex(i => i.itemId === worldItem.itemId && i.amount === worldItem.amount);
            if(idx !== -1) {
                chunkMod.worldItems.splice(idx, 1);
            }
        }

        if(chunkMod.worldItems.length === 0) {
            this.clearTileIfEmpty(worldItem.position);
        }

        worldItem.removed = true;
        this.worldItemRemoved(worldItem);

        if(worldItem.respawns !== undefined) {
            this.respawnItem(worldItem);
        }
    }

    /**
     * Re-spawns a previously de-spawned world item after a specified amount of time.
     * @param worldItem The item to re-spawn.
     */
    public async respawnItem(worldItem: WorldItem): Promise<void> {
        await schedule(worldItem.respawns);

        this.spawnWorldItem({
            itemId: worldItem.itemId,
            amount: worldItem.amount
        }, worldItem.position, {
            respawns: worldItem.respawns,
            owner: worldItem.owner,
            expires: worldItem.expires
        });
    }

    /**
     * Adds a world item to the view of any nearby players in this instance.
     * @param worldItem The world item that was added.
     * @param excludePlayer [optional] A specific player to not show this world item update to.
     * Usually this is used when a player drops the item and it should appear for them immediately, but have a delay
     * before being shown to other players in the instance.
     */
    public worldItemAdded(worldItem: WorldItem, excludePlayer?: Player): void {
        const nearbyPlayers = world.findNearbyPlayers(worldItem.position, 16, this.instanceId) || [];

        nearbyPlayers.forEach(player => {
            if(excludePlayer && excludePlayer.equals(player)) {
                return;
            }

            player.outgoingPackets.setWorldItem(worldItem, worldItem.position);
        });
    }

    /**
     * Removes a world item from the view of any nearby players in this instance.
     * @param worldItem The world item that was removed.
     */
    public worldItemRemoved(worldItem: WorldItem): void {
        const nearbyPlayers = world.findNearbyPlayers(worldItem.position, 16, this.instanceId) || [];

        nearbyPlayers.forEach(player =>
            player.outgoingPackets.removeWorldItem(worldItem, worldItem.position));
    }


    /**
     * Temporarily hides a game object from the game world.
     * @param object The game object to temporarily hide from view.
     * @param hideTicks The number of game cycles/ticks before the object will be shown again.
     */
    public async hideGameObjectTemporarily(object: LandscapeObject, hideTicks: number): Promise<void> {
        this.hideGameObject(object);
        await schedule(hideTicks);
        this.showGameObject(object);
    }


    /**
     * Spawns a temporary game object within the game world.
     * @param object The game object to spawn.
     * @param position The position to spawn the object at.
     * @param despawnTicks The number of game cycles/ticks before the object will de-spawn.
     */
    public async spawnTemporaryGameObject(object: LandscapeObject, position: Position, despawnTicks: number): Promise<void> {
        this.spawnGameObject(object);
        await schedule(despawnTicks);
        this.despawnGameObject(object);
    }

    /**
     * Removes one game object and adds another to the game world. The new object may be completely different from
     * the one being removed, and in different positions. NOT to be confused with `replaceObject`, which will replace
     * and existing object with another object of the same type, orientation, and position.
     * @param newObject The game object being spawned.
     * @param oldObject The game object being removed.
     * @param newObjectInCache Whether or not the object being added is the original game-cache object.
     */
    public toggleGameObjects(newObject: LandscapeObject, oldObject: LandscapeObject, newObjectInCache: boolean): void {
        if(newObjectInCache) {
            this.showGameObject(newObject);
            this.despawnGameObject(oldObject);
        } else {
            this.hideGameObject(oldObject);
            this.spawnGameObject(newObject);
        }
    }

    /**
     * Replaces a game object within the instance with a different object of the same object type, orientation, and position.
     * NOT to be confused with `toggleGameObjects`, which removes one object and adds a different one that may have a differing
     * type, orientation, or position (such as a door being opened).
     * @param newObject The new game object to spawn, or the id of the location object to spawn.
     * @param oldObject The game object being replaced. Usually a game-cache-stored object.
     * @param respawnTicks [optional] How many ticks it will take before the original location object respawns.
     * If not provided, the original game object will never re-spawn and the new location object will forever
     * remain in it's place (in this instance).
     */
    public async replaceGameObject(newObject: LandscapeObject | number, oldObject: LandscapeObject, respawnTicks?: number): Promise<void> {
        if(typeof newObject === 'number') {
            newObject = {
                objectId: newObject,
                x: oldObject.x,
                y: oldObject.y,
                level: oldObject.level,
                type: oldObject.type,
                orientation: oldObject.orientation
            } as LandscapeObject;
        }

        this.hideGameObject(oldObject);
        this.spawnGameObject(newObject);

        if(respawnTicks !== undefined) {
            await schedule(respawnTicks);
            this.despawnGameObject(newObject as LandscapeObject);
            this.showGameObject(oldObject);
        }
    }

    /**
     * Spawn a new game object into the instance.
     * @param object The game object to spawn.
     * @param reference Whether or not the object being spawned is a reference to an existing object or if it should
     * be sent to the game client for forced rendering. Defaults to false for forced rendering.
     */
    public spawnGameObject(object: LandscapeObject, reference: boolean = false): void {
        const position = new Position(object.x, object.y, object.level);

        const { chunk: instancedChunk, mods } = this.getTileModifications(position);

        if(mods.spawnedObjects.find(o => o.x === object.x && o.y === object.y && o.level === object.level && o.type === object.type)) {
            return;
        }

        mods.spawnedObjects.push(object);
        instancedChunk.mods.set(position.key, mods);

        instancedChunk.collisionMap.markGameObject(object, true);

        const nearbyPlayers = world.findNearbyPlayers(position, 16, this.instanceId) || [];
        nearbyPlayers.forEach(player => player.outgoingPackets.setLocationObject(object, position));
    }

    /**
     * Remove a previously spawned game object from the instance.
     * @param object The game object to de-spawn.
     */
    public despawnGameObject(object: LandscapeObject): void {
        const position = new Position(object.x, object.y, object.level);
        const instancedChunk = this.getInstancedChunk(position);

        if(!instancedChunk.mods.has(position.key)) {
            // Object no longer exists
            return;
        }

        const tileModifications = instancedChunk.mods.get(position.key);
        if(tileModifications.spawnedObjects && tileModifications.spawnedObjects.length !== 0) {
            const idx = tileModifications.spawnedObjects.findIndex(o => o.objectId === object.objectId &&
                o.type === object.type && o.orientation === object.orientation);
            if(idx !== -1) {
                tileModifications.spawnedObjects.splice(idx, 1);
            }
        }

        if(tileModifications.spawnedObjects.length === 0) {
            this.clearTileIfEmpty(position);
        }

        instancedChunk.collisionMap.markGameObject(object, false);

        const nearbyPlayers = world.findNearbyPlayers(position, 16, this.instanceId) || [];
        nearbyPlayers.forEach(player => player.outgoingPackets.removeLocationObject(object, position));
    }

    /**
     * Hides a static game object from an instance.
     * @param object The cache game object to hide from the instance.
     */
    public hideGameObject(object: LandscapeObject): void {
        const position = new Position(object.x, object.y, object.level);

        const { chunk: instancedChunk, mods } = this.getTileModifications(position);

        mods.hiddenObjects.push(object);
        instancedChunk.mods.set(position.key, mods);

        instancedChunk.collisionMap.markGameObject(object, false);

        const nearbyPlayers = world.findNearbyPlayers(position, 16, this.instanceId) || [];
        nearbyPlayers.forEach(player => player.outgoingPackets.removeLocationObject(object, position));
    }

    /**
     * Shows a previously hidden static game object.
     * @param object The cache game object to stop hiding from view.
     */
    public showGameObject(object: LandscapeObject): void {
        const position = new Position(object.x, object.y, object.level);
        const instancedChunk = this.getInstancedChunk(position);

        if(!instancedChunk.mods.has(position.key)) {
            // Object no longer exists
            return;
        }

        const tileModifications = instancedChunk.mods.get(position.key);
        if(tileModifications.hiddenObjects && tileModifications.hiddenObjects.length !== 0) {
            const idx = tileModifications.hiddenObjects.findIndex(o => o.objectId === object.objectId &&
                o.type === object.type && o.orientation === object.orientation);
            if(idx !== -1) {
                tileModifications.hiddenObjects.splice(idx, 1);
            }
        }

        if(tileModifications.hiddenObjects.length === 0) {
            this.clearTileIfEmpty(position);
        }

        instancedChunk.collisionMap.markGameObject(object, true);

        const nearbyPlayers = world.findNearbyPlayers(position, 16, this.instanceId) || [];
        nearbyPlayers.forEach(player => player.outgoingPackets.setLocationObject(object, position));
    }

    /**
     * Fetch a list of world modifications from this instance.
     * @param worldPosition The game world position to find the chunk for.
     */
    public getInstancedChunk(worldPosition: Position): InstancedChunk;


    /**
     * Fetch a list of world modifications from this instance.
     * @param x The X coordinate to find the chunk of.
     * @param y The Y coordinate to find the chunk of.
     * @param level The height level of the chunk.
     */
    public getInstancedChunk(x: number, y: number, level: number): InstancedChunk;

    public getInstancedChunk(worldPositionOrX: Position | number, y?: number, level?: number): InstancedChunk {
        let chunkPosition: Position;

        if(typeof worldPositionOrX === 'number') {
            const chunk = world.chunkManager.getChunk({ x: worldPositionOrX, y, level }) || null;
            if(chunk) {
                chunkPosition = chunk.position;
            }
        } else {
            chunkPosition = world.chunkManager.getChunkForWorldPosition(worldPositionOrX)?.position || null;
        }

        if(!chunkPosition) {
            // Chunk not found - fail gracefully
            return {
                collisionMap: new CollisionMap(chunkPosition.x, chunkPosition.y, chunkPosition.level, { instance: this }),
                mods: new Map<string, TileModifications>()
            };
        }

        if(!this.chunkModifications.has(chunkPosition.key)) {
            this.chunkModifications.set(chunkPosition.key, {
                collisionMap: new CollisionMap(chunkPosition.x, chunkPosition.y, chunkPosition.level, { instance: this }),
                mods: new Map<string, TileModifications>()
            });
        }

        return this.chunkModifications.get(chunkPosition.key);
    }

    /**
     * Fetches the list of tile modifications for a specific game tile in this instance.
     * @param worldPosition The world position to find the modifications for.
     */
    public getTileModifications(worldPosition: Position): { chunk: InstancedChunk, mods: TileModifications } {
        const instancedChunk = this.getInstancedChunk(worldPosition);
        if(instancedChunk.mods.has(worldPosition.key)) {
            return { chunk: instancedChunk, mods: instancedChunk.mods.get(worldPosition.key) };
        } else {
            return { chunk: instancedChunk, mods: new TileModifications() };
        }
    }

    /**
     * Adds a new player to this instance.
     * @param player The player to allow in.
     */
    public addPlayer(player: Player): void {
        this.players.set(player.username, player);
    }

    /**
     * Removes a player from this instance.
     * If the instance is not the global instance and
     * there are no more players within it, then this will gracefully close the instance.
     * @param player The player remove from the instance.
     */
    public removePlayer(player: Player): void {
        this.players.delete(player.username);

        if(this.instanceId !== null && this.players.size === 0) {
            this.chunkModifications.clear();
            const instancedNpcs = world.findNpcsByInstance(this.instanceId);
            instancedNpcs?.forEach(npc => world.deregisterNpc(npc));
        }
    }

    /**
     * Checks to see if the specified world tile is devoid of modifications for this instance.
     * If it is, this method will delete the `TileModifications` entry to free up memory.
     * @param worldPosition The position of the game world tile to check.
     * @private
     */
    private clearTileIfEmpty(worldPosition: Position): void {
        const instancedChunk = this.getInstancedChunk(worldPosition);
        if(instancedChunk.mods.has(worldPosition.key)) {
            const mods = instancedChunk.mods.get(worldPosition.key);
            if(mods.empty) {
                instancedChunk.mods.delete(worldPosition.key);
            }
        }
    }

}
