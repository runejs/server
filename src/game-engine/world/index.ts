import { logger } from '@runejs/core';
import Quadtree from 'quadtree-lib';
import { Player } from './actor/player/player';
import { ChunkManager } from './map/chunk-manager';
import { ExamineCache } from './config/examine-data';
import { loadPlugins, world } from '@engine/game-server';
import { Position } from './position';
import { Npc } from './actor/npc/npc';
import TravelLocations from '@engine/world/config/travel-locations';
import { Actor } from '@engine/world/actor/actor';
import { schedule } from '@engine/world/task';
import { parseScenerySpawns } from '@engine/world/config/scenery-spawns';
import { findItem, findNpc, findObject, itemSpawns, npcSpawns } from '@engine/config';
import { NpcDetails } from '@engine/config/npc-config';
import { WorldInstance } from '@engine/world/instances';
import { Direction } from '@engine/world/direction';
import { NpcSpawn } from '@engine/config/npc-spawn-config';
import { loadActionFiles } from '@engine/world/action';
import { LandscapeObject } from '@runejs/filestore';
import { lastValueFrom, Subject } from 'rxjs';
import { take } from 'rxjs/operators';
import { ConstructedRegion, getTemplateLocalX, getTemplateLocalY } from '@engine/world/map/region';
import { Chunk } from '@engine/world/map/chunk';


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
    public readonly scenerySpawns: LandscapeObject[];
    public readonly travelLocations: TravelLocations = new TravelLocations();
    public readonly playerTree: Quadtree<QuadtreeKey>;
    public readonly npcTree: Quadtree<QuadtreeKey>;
    public readonly globalInstance = new WorldInstance();
    public readonly tickComplete: Subject<void> = new Subject<void>();

    private readonly debugCycleDuration: boolean = process.argv.indexOf('-tickTime') !== -1;

    public constructor() {
        this.scenerySpawns = parseScenerySpawns();
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
        await loadActionFiles();
        this.spawnGlobalNpcs();
        this.spawnWorldItems();
        this.spawnScenery();
    }

    /**
     * Searched for an object by ID at the given position in any of the player's active instances.
     * @param actor The actor to find the object for.
     * @param objectId The game ID of the object.
     * @param objectPosition The game world position that the object is expected at.
     */
    public findObjectAtLocation(actor: Actor, objectId: number,
                                objectPosition: Position): { object: LandscapeObject, cacheOriginal: boolean } {
        const x = objectPosition.x;
        const y = objectPosition.y;

        const objectChunk = this.chunkManager.getChunkForWorldPosition(objectPosition);

        let customMap = false;
        if(actor instanceof Player && actor.metadata.customMap) {
            customMap = true;
            const templateMapObject = this.findCustomMapObject(actor, objectId, objectPosition);
            if(templateMapObject) {
                return { object: templateMapObject, cacheOriginal: true };
            }
        }

        let cacheOriginal = true;

        let tileModifications;
        let personalTileModifications;

        if(actor.isPlayer) {
            tileModifications = (actor as Player).instance.getTileModifications(objectPosition);
            personalTileModifications = (actor as Player).personalInstance.getTileModifications(objectPosition);
        } else {
            tileModifications = this.globalInstance.getTileModifications(objectPosition);
        }

        let landscapeObject = customMap ? null : objectChunk.getFilestoreLandscapeObject(objectId, objectPosition);
        if(!landscapeObject) {
            const tileObjects = [ ...tileModifications.mods.spawnedObjects ];

            if(actor.isPlayer) {
                tileObjects.push(...personalTileModifications.mods.spawnedObjects);
            }

            landscapeObject = tileObjects.find(spawnedObject =>
                spawnedObject.objectId === objectId && spawnedObject.x === x && spawnedObject.y === y) || null;

            cacheOriginal = false;

            if(!landscapeObject) {
                return { object: null, cacheOriginal: false };
            }
        }

        const hiddenTileObjects = [ ...tileModifications.mods.hiddenObjects ];

        if(actor.isPlayer) {
            hiddenTileObjects.push(...personalTileModifications.mods.hiddenObjects);
        }

        if(hiddenTileObjects.findIndex(spawnedObject =>
            spawnedObject.objectId === objectId && spawnedObject.x === x && spawnedObject.y === y) !== -1) {
            return { object: null, cacheOriginal: false };
        }

        return {
            object: landscapeObject,
            cacheOriginal
        };
    }

    /**
     * Locates a map template object from the actor's active custom map (if applicable).
     * @param actor The actor to find the object for.
     * @param objectId The ID of the object to find.
     * @param objectPosition The position of the copied object to find the template of.
     */
    public findCustomMapObject(actor: Actor, objectId: number, objectPosition: Position): LandscapeObject | null {
        const map = actor?.metadata?.customMap as ConstructedRegion || null;

        if(!map) {
            return null;
        }

        const objectConfig = findObject(objectId);

        if(!objectConfig) {
            return null;
        }

        const objectChunk = this.chunkManager.getChunkForWorldPosition(objectPosition);
        const mapChunk = world.chunkManager.getChunkForWorldPosition(map.renderPosition);

        const chunkIndexX = objectChunk.position.x - (mapChunk.position.x - 2);
        const chunkIndexY = objectChunk.position.y - (mapChunk.position.y - 2);

        const objectTile = map.chunks[actor.position.level][chunkIndexX][chunkIndexY];

        const tileX = objectTile.templatePosition.x;
        const tileY = objectTile.templatePosition.y;
        const tileOrientation = objectTile.rotation;

        const objectLocalX = objectPosition.x - (objectChunk.position.x + 6) * 8;
        const objectLocalY = objectPosition.y - (objectChunk.position.y + 6) * 8;

        const mapTemplateWorldX = tileX;
        const mapTemplateWorldY = tileY;
        const mapTemplateChunk = world.chunkManager.getChunkForWorldPosition(new Position(mapTemplateWorldX, mapTemplateWorldY, objectPosition.level));

        const templateLocalX = getTemplateLocalX(tileOrientation, objectLocalX, objectLocalY,
            objectConfig?.rendering?.sizeX || 1, objectConfig?.rendering?.sizeY || 1);
        const templateLocalY = getTemplateLocalY(tileOrientation, objectLocalX, objectLocalY,
            objectConfig?.rendering?.sizeX || 1, objectConfig?.rendering?.sizeY || 1);

        const templateObjectPosition = new Position(mapTemplateWorldX + templateLocalX,
            mapTemplateWorldY + templateLocalY, objectPosition.level);
        const realObject = mapTemplateChunk.getFilestoreLandscapeObject(objectId, templateObjectPosition);

        if(!realObject) {
            return null;
        }

        realObject.x = objectPosition.x;
        realObject.y = objectPosition.y;
        realObject.level = objectPosition.level;

        let rotation = realObject.orientation + objectTile.rotation;
        if(rotation > 3) {
            rotation -= 4;
        }

        realObject.orientation = rotation;

        return realObject || null;
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
     * Finds all NPCs within the game world that have the specified Npc Key.
     * @param npcKey The Key of the NPCs to find.
     * @param instanceId The NPC's active instance.
     */
    public findNpcsByKey(npcKey: string, instanceId: string = null): Npc[] {
        return this.npcList.filter(npc => npc && npc.key === npcKey && npc.instanceId === instanceId);
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
     * Finds all NPCs within the specified instance.
     * @param instanceId The NPC's active instance.
     */
    public findNpcsByInstance(instanceId: string): Npc[] {
        return this.npcList.filter(npc => npc && npc.instanceId === instanceId);
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
        })
            .map(quadree => quadree.actor as Player)
            .filter(player => player.personalInstance.instanceId === instanceId ||
                player.instance.instanceId === instanceId);
    }

    /**
     * Finds a logged in player via their username.
     * @param username The player's username.
     */
    public findActivePlayerByUsername(username: string): Player {
        username = username.toLowerCase();
        return this.playerList.find(p => p && p.username.toLowerCase() === username);
    }

    /**
     * Spawns the list of pre-configured items into either the global instance or a player's personal instance.
     * @param player [optional] The player to load the instanced items for. Uses the global world instance if not provided.
     */
    public spawnWorldItems(player?: Player): void {
        const instance = player ? player.personalInstance : this.globalInstance;

        itemSpawns.filter(spawn => player ? spawn.instance === 'player' : spawn.instance === 'global')
            .forEach(itemSpawn => {
                const itemDetails = findItem(itemSpawn.itemKey);
                if(itemDetails && itemDetails.gameId !== undefined) {
                    instance.spawnWorldItem({ itemId: itemDetails.gameId, amount: itemSpawn.amount },
                        itemSpawn.spawnPosition, { respawns: itemSpawn.respawn, owner: player || undefined });
                } else {
                    logger.error(`Item ${itemSpawn.itemKey} can not be spawned; it has not yet been registered on the server.`);
                }
            });
    }

    public spawnGlobalNpcs(): void {
        npcSpawns.forEach(npcSpawn => {
            const npcDetails = findNpc(npcSpawn.npcKey) || null;
            if(npcDetails && npcDetails.gameId !== undefined) {
                this.registerNpc(new Npc(npcDetails, npcSpawn));
            } else {
                logger.error(`NPC ${npcSpawn.npcKey} can not be spawned; it has not yet been registered on the server.`);
            }
        });
    }

    public async spawnNpc(npcKey: string | number, position: Position, face: Direction,
                          movementRadius: number = 0, instanceId: string = null): Promise<Npc> {
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

        const npc = new Npc(npcData,
            new NpcSpawn(typeof npcData === 'number' ? `unknown_${npcData}` : npcData.key,
                position, movementRadius, face), instanceId);

        await this.registerNpc(npc);

        return npc;
    }

    public spawnScenery(): void {
        this.scenerySpawns.forEach(locationObject =>
            this.globalInstance.spawnGameObject(locationObject));
    }

    public async setupWorldTick(): Promise<void> {
        await schedule(1);
        this.worldTick();
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
            player.interfaceState.closeAllSlots();

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
                setTimeout(async() => this.worldTick(), World.TICK_LENGTH); //TODO: subtract processing time
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

        setTimeout(async() => this.worldTick(), delay);
        this.tickComplete.next();
        return Promise.resolve();
    }

    public async nextTick(): Promise<void> {
        await lastValueFrom(this.tickComplete.asObservable().pipe(take(1)));
    }

    public async ticks(count: number): Promise<void> {
        await lastValueFrom(this.tickComplete.asObservable().pipe(take(count)));
    }

    public async scheduleNpcRespawn(npc: Npc): Promise<boolean> {
        await schedule(10);
        return await this.registerNpc(npc);
    }

    /**
     * Returns the number of remaining open player slots before this world reaches maximum capacity.
     */
    public playerSlotsRemaining(): number {
        return this.playerList.filter(player => !player).length;
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

    /**
     * Registers a new player to the game world.
     * Returns false if the world is full, otherwise returns true when the player has been registered.
     * @param player The player to register.
     */
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

    /**
     * Clears the given player's game world slot, signalling that they have disconnected fully.
     * @param player The player to remove from the world list.
     */
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

    public async registerNpc(npc: Npc): Promise<boolean> {
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
        await npc.init();
        return true;
    }

    public deregisterNpc(npc: Npc): void {
        npc.exists = false;
        this.npcList[npc.worldIndex] = null;
    }

}
