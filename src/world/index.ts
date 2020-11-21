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
import { schedule } from '@server/task/task';
import { parseScenerySpawns } from '@server/world/config/scenery-spawns';
import { loadActions } from '@server/world/action';
import { findNpc } from '@server/config';
import { NpcDetails } from '@server/config/npc-config';
import { WorldInstance } from '@server/world/instances';
import { Direction } from '@server/world/direction';


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
            .filter(player => player.instance.instanceId === instanceId);
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

    public spawnNpc(npcKey: string | number, position: Position, face: Direction,
        movementRadius: number = 0, instanceId: string = null): Npc {
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
            level: position.level || 0,
            face,
            radius: movementRadius
        }, instanceId);

        this.registerNpc(npc);

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
