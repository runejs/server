import { LocationObject } from '@runejs/cache-parser';
import { Position } from '@server/world/position';
import { world } from '@server/game-server';
import { WorldItem } from '@server/world/items/world-item';
import { Item } from '@server/world/items/item';
import { Player } from '@server/world/actor/player/player';
import { World } from '@server/world/index';
import { schedule } from '@server/task/task';
import { CollisionMap } from '@server/world/map/collision-map';


/**
 * Modifications made to a single game tile within an instance.
 */
export interface WorldModifications {
    spawnedObjects?: LocationObject[];
    hiddenObjects?: LocationObject[];
    worldItems?: WorldItem[];
}

/**
 * A game world chunk that is tied to a specific instance.
 */
export interface InstancedChunk {
    collisionMap: CollisionMap;
    mods: Map<string, WorldModifications>;
}

/**
 * A player or group instance within the world.
 */
export class WorldInstance {

    /**
     * A list of game world chunks that have modifications made to them in this instance.
     */
    public readonly chunkModifications = new Map<string, InstancedChunk>();
    public readonly players: Map<string, Player> = new Map<string, Player>();

    public constructor(public readonly instanceId: string = null) {
    }

    /**
     * Spawns a new world item in this instance.
     * @param item The item to spawn into the game world.
     * @param position The position to spawn the item at.
     * @param owner [optional] The original owner of the item, if there is one.
     * @param expires [optional] When the world object should expire and de-spawn.
     * If not provided, the item will stay within the instance indefinitely.
     */
    public spawnWorldItem(item: Item | number, position: Position, owner?: Player, expires?: number): WorldItem {
        if(typeof item === 'number') {
            item = { itemId: item, amount: 1 };
        }
        const worldItem: WorldItem = {
            itemId: item.itemId,
            amount: item.amount,
            position,
            owner,
            expires,
            instanceId: this.instanceId
        };

        const chunkMap = this.getInstancedChunk(position);

        let chunkMod: WorldModifications = {};
        if(chunkMap.mods.has(position.key)) {
            chunkMod = chunkMap.mods.get(position.key);
        }

        if(!chunkMod.worldItems) {
            chunkMod.worldItems = [];
        }

        chunkMod.worldItems.push(worldItem);

        chunkMap.mods.set(position.key, chunkMod);

        if(owner) {
            // If this world item is only visible to one player initially, we setup a timeout to spawn it for all other
            // players after 100 game cycles.
            owner.outgoingPackets.setWorldItem(worldItem, worldItem.position);
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
            delete chunkMod.worldItems;
        }

        worldItem.removed = true;
        this.worldItemRemoved(worldItem);
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

        nearbyPlayers.forEach(player => {
            player.outgoingPackets.removeWorldItem(worldItem, worldItem.position);
        });
    }


    /**
     * Temporarily hides a game object from the game world.
     * @param object The game object to temporarily hide from view.
     * @param hideTicks The number of game cycles/ticks before the object will be shown again.
     */
    public async hideGameObjectTemporarily(object: LocationObject, hideTicks: number): Promise<void> {
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
    public async spawnTemporaryGameObject(object: LocationObject, position: Position, despawnTicks: number): Promise<void> {
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
    public toggleGameObjects(newObject: LocationObject, oldObject: LocationObject, newObjectInCache: boolean): void {
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
    public async replaceGameObject(newObject: LocationObject | number, oldObject: LocationObject, respawnTicks?: number): Promise<void> {
        if(typeof newObject === 'number') {
            newObject = {
                objectId: newObject,
                x: oldObject.x,
                y: oldObject.y,
                level: oldObject.level,
                type: oldObject.type,
                orientation: oldObject.orientation
            } as LocationObject;
        }

        this.hideGameObject(oldObject);
        this.spawnGameObject(newObject);

        if(respawnTicks !== undefined) {
            await schedule(respawnTicks);
            this.despawnGameObject(newObject as LocationObject);
            this.showGameObject(oldObject);
        }
    }

    /**
     * Spawn a new game object into the instance.
     * @param object The game object to spawn.
     */
    public spawnGameObject(object: LocationObject): void {
        const position = new Position(object.x, object.y, object.level);
        const instancedChunk = this.getInstancedChunk(position);

        let chunkMod: WorldModifications = {};
        if(instancedChunk.mods.has(position.key)) {
            chunkMod = instancedChunk.mods.get(position.key);
        }

        if(!chunkMod.spawnedObjects) {
            chunkMod.spawnedObjects = [];
        }

        chunkMod.spawnedObjects.push(object);
        instancedChunk.mods.set(position.key, chunkMod);

        instancedChunk.collisionMap.markGameObject(object, true);

        const nearbyPlayers = world.findNearbyPlayers(position, 16, this.instanceId) || [];
        nearbyPlayers.forEach(player => player.outgoingPackets.setLocationObject(object, position));
    }

    /**
     * Remove a previously spawned game object from the instance.
     * @param object The game object to de-spawn.
     */
    public despawnGameObject(object: LocationObject): void {
        const position = new Position(object.x, object.y, object.level);
        const instancedChunk = this.getInstancedChunk(position);

        if(!instancedChunk.mods.has(position.key)) {
            // Object no longer exists
            return;
        }

        const chunkMod = instancedChunk.mods.get(position.key);
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

        instancedChunk.collisionMap.markGameObject(object, false);

        const nearbyPlayers = world.findNearbyPlayers(position, 16, this.instanceId) || [];
        nearbyPlayers.forEach(player => player.outgoingPackets.removeLocationObject(object, position));
    }

    /**
     * Hides a static game object from an instance.
     * @param object The cache game object to hide from the instance.
     */
    public hideGameObject(object: LocationObject): void {
        const position = new Position(object.x, object.y, object.level);
        const instancedChunk = this.getInstancedChunk(position);

        let chunkMod: WorldModifications = {};
        if(instancedChunk.mods.has(position.key)) {
            chunkMod = instancedChunk.mods.get(position.key);
        }

        if(!chunkMod.hiddenObjects) {
            chunkMod.hiddenObjects = [];
        }

        chunkMod.hiddenObjects.push(object);
        instancedChunk.mods.set(position.key, chunkMod);

        instancedChunk.collisionMap.markGameObject(object, false);

        const nearbyPlayers = world.findNearbyPlayers(position, 16, this.instanceId) || [];
        nearbyPlayers.forEach(player => player.outgoingPackets.removeLocationObject(object, position));
    }

    /**
     * Shows a previously hidden static game object.
     * @param object The cache game object to stop hiding from view.
     */
    public showGameObject(object: LocationObject): void {
        const position = new Position(object.x, object.y, object.level);
        const instancedChunk = this.getInstancedChunk(position);

        if(!instancedChunk.mods.has(position.key)) {
            // Object no longer exists
            return;
        }

        const chunkMod = instancedChunk.mods.get(position.key);
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
                mods: new Map<string, WorldModifications>()
            };
        }

        if(!this.chunkModifications.has(chunkPosition.key)) {
            this.chunkModifications.set(chunkPosition.key, {
                collisionMap: new CollisionMap(chunkPosition.x, chunkPosition.y, chunkPosition.level, { instance: this }),
                mods: new Map<string, WorldModifications>()
            });
        }

        return this.chunkModifications.get(chunkPosition.key);
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

}
