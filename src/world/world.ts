import { Player } from './actor/player/player';
import { ChunkManager } from './map/chunk-manager';
import { logger } from '@runejs/logger';
import { ItemDetails, parseItemData } from './config/item-data';
import { gameCache } from '@server/game-server';
import { Position } from './position';
import { NpcSpawn, parseNpcSpawns } from './config/npc-spawn';
import { Npc } from './actor/npc/npc';
import { parseShops, Shop } from '@server/world/config/shops';
import Quadtree from 'quadtree-lib';
import { timer } from 'rxjs';
import { Actor } from '@server/world/actor/actor';

export interface QuadtreeKey {
    x: number;
    y: number;
    actor: Actor;
}

/**
 * Controls the game world and all entities within it.
 */
export class World {

    public static readonly MAX_PLAYERS = 1000;
    public static readonly MAX_NPCS = 30000;
    public static readonly TICK_LENGTH = 600;
    private readonly debugCycleDuration: boolean = process.argv.indexOf('-tickTime') !== -1;

    public readonly playerList: Player[] = new Array(World.MAX_PLAYERS).fill(null);
    public readonly npcList: Npc[] = new Array(World.MAX_NPCS).fill(null);
    public readonly chunkManager: ChunkManager = new ChunkManager();
    public readonly itemData: Map<number, ItemDetails>;
    public readonly npcSpawns: NpcSpawn[];
    public readonly shops: Shop[];
    public readonly playerTree: Quadtree<any>;
    public readonly npcTree: Quadtree<any>;

    public constructor() {
        this.itemData = parseItemData(gameCache.itemDefinitions);
        this.npcSpawns = parseNpcSpawns();
        this.shops = parseShops();
        this.playerTree = new Quadtree<any>({
            width: 10000,
            height: 10000
        });
        this.npcTree = new Quadtree<any>({
            width: 10000,
            height: 10000
        });

        this.setupWorldTick();
    }

    public init(): void {
        new Promise(resolve => {
            this.chunkManager.generateCollisionMaps();
            resolve();
        }).then(() => {
            this.spawnNpcs();
        });
    }

    public spawnNpcs(): void {
        this.npcSpawns.forEach(npcSpawn => {
            const npcDefinition = gameCache.npcDefinitions.get(npcSpawn.npcId);
            const npc = new Npc(npcSpawn, npcDefinition);
            this.registerNpc(npc);
        });
    }

    public setupWorldTick(): void {
        timer(World.TICK_LENGTH).toPromise().then(() => this.worldTick());
    }

    public generateFakePlayers(): void {
        let x: number = 3222;
        let y: number = 3222;
        let xOffset: number = 0;
        let yOffset: number = 0;

        const spawnChunk = this.chunkManager.getChunkForWorldPosition(new Position(x, y, 0));

        for(let i = 0; i < 990; i++) {
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
                setTimeout(() => this.worldTick(), World.TICK_LENGTH); //TODO: subtract processing time
            });
        }
        
        const activeNpcs: Npc[] = this.npcList.filter(npc => npc !== null);

        await Promise.all([ ...activePlayers.map(player => player.tick()), ...activeNpcs.map(npc => npc.tick()) ]);

        const playerUpdateTasks = activePlayers.map(player => player.playerUpdateTask.execute());
        const npcUpdateTasks = activePlayers.map(player => player.npcUpdateTask.execute());

        await Promise.all([ ...playerUpdateTasks, ...npcUpdateTasks ]);
        await Promise.all([ ...activePlayers.map(player => player.reset()), ...activeNpcs.map(npc => npc.reset()) ]);

        const hrEnd = Date.now();
        const duration = hrEnd - hrStart;
        const delay = Math.max(World.TICK_LENGTH - duration, 0);

        if(this.debugCycleDuration) {
            logger.info(`World tick completed in ${duration} ms, next tick in ${delay} ms.`);
        }

        setTimeout(() => this.worldTick(), delay);
        return Promise.resolve();
    }

    public playerExists(player: Player): boolean {
        const foundPlayer = this.playerList[player.worldIndex];
        if(!foundPlayer) {
            return false;
        }

        return foundPlayer.equals(player);
    }

    public registerPlayer(player: Player): boolean {
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
        if(!foundNpc) {
            return false;
        }

        return foundNpc.equals(npc);
    }

    public registerNpc(npc: Npc): boolean {
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
        this.npcList[npc.worldIndex] = null;
    }

}
