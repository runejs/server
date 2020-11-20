import { logger } from '@runejs/core';
import { LocationObject } from '@runejs/cache-parser';
import Quadtree from 'quadtree-lib';
import { timer } from 'rxjs';
import { Player } from './actor/player/player';
import { ChunkManager } from './map/chunk-manager';
import { ExamineCache } from './config/examine-data';
import { loadPlugins } from '@server/game-server';
import { Position } from './position';
import { NpcSpawn, parseNpcSpawns } from './config/npc-spawn';
import { Npc } from './actor/npc/npc';
import { parseShops, Shop } from '@server/world/config/shops';
import TravelLocations from '@server/world/config/travel-locations';
import { Actor } from '@server/world/actor/actor';
import { Chunk } from '@server/world/map/chunk';
import { schedule } from '@server/task/task';
import { parseScenerySpawns } from '@server/world/config/scenery-spawns';
import { loadActions } from '@server/world/action';
import { findNpc } from '@server/config';
import { NpcDetails } from '@server/config/npc-config';
import { WorldInstance } from '@server/world/instances';


export interface QuadtreeKey {
    x: number;
    y: number;
    actor: Actor;
}

/**
 * Controls the game world and all entities within it.
 */
export class World {

    public static readonly MAX_PLAYERS = 1600;
    public static readonly MAX_NPCS = 30000;
    public static readonly TICK_LENGTH = 600;

    public readonly playerList: Player[] = new Array(World.MAX_PLAYERS).fill(null);
    public readonly npcList: Npc[] = new Array(World.MAX_NPCS).fill(null);
    public readonly chunkManager: ChunkManager = new ChunkManager();
    public readonly examine: ExamineCache = new ExamineCache();
    public readonly npcSpawns: NpcSpawn[];
    public readonly scenerySpawns: LocationObject[];
    public readonly shops: Shop[];
    public readonly travelLocations: TravelLocations = new TravelLocations();
    public readonly playerTree: Quadtree<QuadtreeKey>;
    public readonly npcTree: Quadtree<QuadtreeKey>;
    public readonly globalInstance = new WorldInstance();

    private readonly debugCycleDuration: boolean = process.argv.indexOf('-tickTime') !== -1;

    public constructor() {
        this.npcSpawns = parseNpcSpawns();
        this.scenerySpawns = parseScenerySpawns();
        this.shops = parseShops();
        this.playerTree = new Quadtree<QuadtreeKey>({
            width: 10000,
            height: 10000
        });
        this.npcTree = new Quadtree<QuadtreeKey>({
            width: 10000,
            height: 10000
        });

        this.setupWorldTick();
    }

    public async init(): Promise<void> {
        await loadPlugins();
        await loadActions();
        this.spawnNpcs();
        this.spawnScenery();
    }

    /**
     * Saves player data for every active player within the game world.
     */
    public saveOnlinePlayers(): void {
        if(!this.playerList) {
            return;
        }

        logger.info(`Saving player data...`);

        this.playerList
            .filter(player => player !== null)
            .forEach(player => player.save());

        logger.info(`Player data saved.`);
    }

    /**
     * Players a sound at a specific position for all players within range of that position.
     * @param position The position to play the sound at.
     * @param soundId The ID of the sound effect.
     * @param volume The volume the sound should play at.
     * @param distance The distance which the sound should reach.
     */
    public playLocationSound(position: Position, soundId: number, volume: number, distance: number = 10): void {
        this.findNearbyPlayers(position, distance).forEach(player => {
            player.outgoingPackets.updateReferencePosition(position);
            player.outgoingPackets.playSoundAtPosition(
                soundId,
                position.x,
                position.y,
                volume
            );
        });
    }

    /**
     * Replaces a location object within the world with a different object of the same object type, orientation, and position.
     * NOT to be confused with `toggleObjects`, which removes one object and adds a different one that may have a differing
     * type, orientation, or position (such as a door being opened).
     * @param newObject The new location object to spawn, or the id of the location object to spawn.
     * @param oldObject The location object being replaced. Usually a game-cache-stored object.
     * @param respawnTicks [optional] How many ticks it will take before the original location object respawns.
     * If not provided, the original location object will never re-spawn and the new location object will forever
     * remain in it's place.
     */
    public replaceLocationObject(newObject: LocationObject | number, oldObject: LocationObject, respawnTicks: number = -1): void {
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

        const position = new Position(newObject.x, newObject.y, newObject.level);
        const chunk = this.chunkManager.getChunkForWorldPosition(position);

        this.deleteAddedLocationObjectMarker(oldObject, position, chunk);
        this.addLocationObject(newObject, position);

        if(respawnTicks !== -1) {
            schedule(respawnTicks).then(() => {
                this.deleteAddedLocationObjectMarker(newObject as LocationObject, position, chunk);
                this.addLocationObject(oldObject, position);
            });
        }
    }

    /**
     * Removes one location object and adds another to the game world. The new object may be completely different from
     * the one being removed, and in different positions. NOT to be confused with `replaceObject`, which will replace
     * and existing object with another object of the same type, orientation, and position.
     * @param newObject The location object being spawned.
     * @param oldObject The location object being removed.
     * @param newPosition The position of the location object being added.
     * @param oldPosition The position of the location object being removed.
     * @param newChunk The chunk which the location object being added resides in.
     * @param oldChunk The chunk which the location object being removed resides in.
     * @param newObjectInCache Whether or not the object being added is the original game-cache object.
     */
    public toggleLocationObjects(newObject: LocationObject, oldObject: LocationObject, newPosition: Position, oldPosition: Position,
        newChunk: Chunk, oldChunk: Chunk, newObjectInCache: boolean): void {
        if(newObjectInCache) {
            this.deleteRemovedLocationObjectMarker(newObject, newPosition, newChunk);
            this.deleteAddedLocationObjectMarker(oldObject, oldPosition, oldChunk);
        }

        this.addLocationObject(newObject, newPosition);
        this.removeLocationObject(oldObject, oldPosition);
    }

    /**
     * Deletes the tracked record of a spawned location object within a single game chunk.
     * @param object The location object to delete the record of.
     * @param position The position which the location object was spawned.
     * @param chunk The map chunk which the location object was spawned.
     */
    public deleteAddedLocationObjectMarker(object: LocationObject, position: Position, chunk: Chunk): void {
        chunk.addedLocationObjects.delete(`${position.x},${position.y},${object.objectId}`);
    }

    /**
     * Deletes the tracked record of a removed/de-spawned location object within a single game chunk.
     * @param object The location object to delete the record of.
     * @param position The position which the location object was removed.
     * @param chunk The map chunk which the location object was removed.
     */
    public deleteRemovedLocationObjectMarker(object: LocationObject, position: Position, chunk: Chunk): void {
        chunk.removedLocationObjects.delete(`${position.x},${position.y},${object.objectId}`);
    }

    /**
     * Spawns a temporary location object within the game world.
     * @param object The location object to spawn.
     * @param position The position to spawn the object at.
     * @param expireTicks The number of game cycles/ticks before the object will de-spawn.
     */
    public async addTemporaryLocationObject(object: LocationObject, position: Position, expireTicks: number): Promise<void> {
        return new Promise(resolve => {
            this.addLocationObject(object, position);

            setTimeout(() => {
                this.removeLocationObject(object, position, false)
                    .then(chunk => this.deleteAddedLocationObjectMarker(object, position, chunk));
                resolve();
            }, expireTicks * World.TICK_LENGTH);
        });
    }

    /**
     * Temporarily de-spawns a location object from the game world.
     * @param object The location object to de-spawn temporarily.
     * @param position The position of the location object.
     * @param expireTicks The number of game cycles/ticks before the object will re-spawn.
     */
    public async removeLocationObjectTemporarily(object: LocationObject, position: Position, expireTicks: number): Promise<void> {
        const chunk = this.chunkManager.getChunkForWorldPosition(position);
        chunk.removeObject(object, position);

        return new Promise(resolve => {
            const nearbyPlayers = this.chunkManager.getSurroundingChunks(chunk).map(chunk => chunk.players).flat();

            nearbyPlayers.forEach(player => {
                if(!player.instance) {
                    player.outgoingPackets.removeLocationObject(object, position);
                }
            });

            setTimeout(() => {
                this.deleteRemovedLocationObjectMarker(object, position, chunk);
                this.addLocationObject(object, position);
                resolve();
            }, expireTicks * World.TICK_LENGTH);
        });
    }

    /**
     * Removes/de-spawns a location object from the game world.
     * @param object The location object to de-spawn.
     * @param position The position of the location object.
     * @param markRemoved [optional] Whether or not to mark the object as removed within it's map chunk. If not provided,
     * the object will be marked as removed.
     */
    public async removeLocationObject(object: LocationObject, position: Position, markRemoved: boolean = true): Promise<Chunk> {
        const chunk = this.chunkManager.getChunkForWorldPosition(position);
        chunk.removeObject(object, position, markRemoved);

        return new Promise(resolve => {
            const nearbyPlayers = this.chunkManager.getSurroundingChunks(chunk).map(chunk => chunk.players).flat();

            nearbyPlayers.forEach(player => {
                if(!player.instance) {
                    player.outgoingPackets.removeLocationObject(object, position);
                }
            });

            resolve(chunk);
        });
    }

    /**
     * Spawns a new location object within the game world.
     * @param object The location object to spawn.
     * @param position The position at which to spawn the object.
     */
    public async addLocationObject(object: LocationObject, position: Position): Promise<void> {
        const chunk = this.chunkManager.getChunkForWorldPosition(position);
        chunk.addObject(object, position);

        return new Promise(resolve => {
            const nearbyPlayers = this.chunkManager.getSurroundingChunks(chunk).map(chunk => chunk.players).flat();

            nearbyPlayers.forEach(player => {
                if(!player.instance) {
                    player.outgoingPackets.setLocationObject(object, position);
                }
            });

            resolve();
        });
    }

    /**
     * Finds all NPCs within the given distance from the given position that have the specified Npc ID.
     * @param position The center position to search from.
     * @param npcId The ID of the NPCs to find.
     * @param distance The maximum distance to search for NPCs.
     * @param instanceId The NPC's active instance.
     */
    public findNearbyNpcsById(position: Position, npcId: number, distance: number, instanceId: string = null): Npc[] {
        return this.npcTree.colliding({
            x: position.x - (distance / 2),
            y: position.y - (distance / 2),
            width: distance,
            height: distance
        }).map(quadree => quadree.actor as Npc).filter(npc => npc.id === npcId && npc.instanceId === instanceId);
    }

    /**
     * Finds all NPCs within the game world that have the specified Npc ID.
     * @param npcId The ID of the NPCs to find.
     * @param instanceId The NPC's active instance.
     */
    public findNpcsById(npcId: number, instanceId: string = null): Npc[] {
        return this.npcList.filter(npc => npc && npc.id === npcId && npc.instanceId === instanceId);
    }

    /**
     * Finds all NPCs within the given distance from the given position.
     * @param position The center position to search from.
     * @param distance The maximum distance to search for NPCs.
     * @param instanceId The NPC's active instance.
     */
    public findNearbyNpcs(position: Position, distance: number, instanceId: string = null): Npc[] {
        return this.npcTree.colliding({
            x: position.x - (distance / 2),
            y: position.y - (distance / 2),
            width: distance,
            height: distance
        }).map(quadree => quadree.actor as Npc).filter(npc => npc.instanceId === instanceId);
    }

    /**
     * Finds all Players within the given distance from the given position.
     * @param position The center position to search from.
     * @param distance The maximum distance to search for Players.
     * @param instanceId The player's active instance.
     */
    public findNearbyPlayers(position: Position, distance: number, instanceId: string = null): Player[] {
        return this.playerTree.colliding({
            x: position.x - (distance / 2),
            y: position.y - (distance / 2),
            width: distance,
            height: distance
        }).map(quadree => quadree.actor as Player).filter(player => player.instance.instanceId === instanceId);
    }

    /**
     * Finds a logged in player via their username.
     * @param username The player's username.
     */
    public findActivePlayerByUsername(username: string): Player {
        username = username.toLowerCase();
        return this.playerList.find(p => p && p.username.toLowerCase() === username);
    }

    public spawnNpcs(): void {
        this.npcSpawns.forEach(npcSpawn => {
            const npcDetails = findNpc(npcSpawn.npcId) || null;
            if(npcDetails && npcDetails.gameId !== undefined) {
                this.registerNpc(new Npc(npcDetails, npcSpawn));
            } else {
                this.registerNpc(new Npc(npcSpawn.npcId, npcSpawn));
            }
        });
    }

    public spawnNpc(npcKey: string | number, position: Position, instanceId: string = null): Npc {
        if(!npcKey) {
            return null;
        }

        let npcData: NpcDetails | number = findNpc(npcKey);
        if(!npcData) {
            logger.warn(`NPC ${npcKey} not yet registered on the server.`);

            if(typeof npcKey === 'number') {
                npcData = npcKey;
            } else {
                return null;
            }
        }

        const npc = new Npc(npcData, {
            npcId: typeof npcData === 'number' ? npcData : npcData.gameId,
            x: position.x,
            y: position.y,
            level: position.level || 0
        }, instanceId);

        this.registerNpc(npc);

        return npc;
    }

    public spawnScenery(): void {
        this.scenerySpawns.forEach(async locationObject =>
            this.addLocationObject(locationObject, new Position(locationObject.x, locationObject.y, locationObject.level)));
    }

    public setupWorldTick(): void {
        timer(World.TICK_LENGTH).toPromise().then(async () => this.worldTick());
    }

    public generateFakePlayers(): void {
        const x: number = 3222;
        const y: number = 3222;
        let xOffset: number = 0;
        let yOffset: number = 0;

        const spawnChunk = this.chunkManager.getChunkForWorldPosition(new Position(x, y, 0));

        for(let i = 0; i < 1000; i++) {
            const player = new Player(null, null, null, i, `test${i}`, 'abs', true);
            this.registerPlayer(player);
            player.activeWidget = null;

            xOffset++;

            if(xOffset > 20) {
                xOffset = 0;
                yOffset--;
            }

            player.position = new Position(x + xOffset, y + yOffset, 0);
            const newChunk = this.chunkManager.getChunkForWorldPosition(player.position);

            if(!spawnChunk.equals(newChunk)) {
                spawnChunk.removePlayer(player);
                newChunk.addPlayer(player);
            }

            player.initiateRandomMovement();
        }
    }

    public async worldTick(): Promise<void> {
        const hrStart = Date.now();
        const activePlayers: Player[] = this.playerList.filter(player => player !== null);

        if(activePlayers.length === 0) {
            return Promise.resolve().then(() => {
                setTimeout(async () => this.worldTick(), World.TICK_LENGTH); //TODO: subtract processing time
            });
        }

        const activeNpcs: Npc[] = this.npcList.filter(npc => npc !== null);

        await Promise.all([ ...activePlayers.map(async player => player.tick()), ...activeNpcs.map(async npc => npc.tick()) ]);
        await Promise.all(activePlayers.map(async player => player.update()));
        await Promise.all([ ...activePlayers.map(async player => player.reset()), ...activeNpcs.map(async npc => npc.reset()) ]);

        const hrEnd = Date.now();
        const duration = hrEnd - hrStart;
        const delay = Math.max(World.TICK_LENGTH - duration, 0);

        if(this.debugCycleDuration) {
            logger.info(`World tick completed in ${duration} ms, next tick in ${delay} ms.`);
        }

        setTimeout(async () => this.worldTick(), delay);
        return Promise.resolve();
    }

    public async scheduleNpcRespawn(npc: Npc): Promise<void> {
        await schedule(10);
        this.registerNpc(npc);
    }

    public findPlayer(playerUsername: string): Player {
        playerUsername = playerUsername.toLowerCase();
        return this.playerList?.find(p => p !== null && p.username.toLowerCase() === playerUsername) || null;
    }

    public playerOnline(player: Player | string): boolean {
        if(typeof player === 'string') {
            player = player.toLowerCase();
            return this.playerList.findIndex(p => p !== null && p.username.toLowerCase() === player) !== -1;
        } else {
            const foundPlayer = this.playerList[player.worldIndex];
            if(!foundPlayer) {
                return false;
            }

            return foundPlayer.equals(player);
        }
    }

    public registerPlayer(player: Player): boolean {
        if(!player) {
            return false;
        }

        const index = this.playerList.findIndex(p => p === null);

        if(index === -1) {
            logger.warn('World full!');
            return false;
        }

        player.worldIndex = index;
        this.playerList[index] = player;
        return true;
    }

    public deregisterPlayer(player: Player): void {
        this.playerList[player.worldIndex] = null;
    }

    public npcExists(npc: Npc): boolean {
        const foundNpc = this.npcList[npc.worldIndex];
        if(!foundNpc || !foundNpc.exists) {
            return false;
        }

        return foundNpc.equals(npc);
    }

    public registerNpc(npc: Npc): boolean {
        if(!npc) {
            return false;
        }

        const index = this.npcList.findIndex(n => n === null);

        if(index === -1) {
            logger.warn('NPC list full!');
            return false;
        }

        npc.worldIndex = index;
        this.npcList[index] = npc;
        npc.init();
        return true;
    }

    public deregisterNpc(npc: Npc): void {
        npc.exists = false;
        this.npcList[npc.worldIndex] = null;
    }

}
