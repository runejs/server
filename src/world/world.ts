import { Player } from './entity/mob/player/player';
import { ChunkManager } from './map/chunk-manager';
import { logger } from '@runejs/logger';
import { ItemData, parseItemData } from './config/item-data';
import { gameCache, world } from '../game-server';
import { Position } from './position';
import yargs from 'yargs';

/**
 * Controls the game world and all entities within it.
 */
export class World {

    public static readonly MAX_PLAYERS = 1000;
    public static readonly TICK_LENGTH = 600;

    public readonly playerList: Player[] = new Array(World.MAX_PLAYERS);
    public readonly chunkManager: ChunkManager = new ChunkManager();
    public readonly itemData: Map<number, ItemData>;

    public constructor() {
        this.itemData = parseItemData(gameCache.itemDefinitions);

        for(let i = 0; i < World.MAX_PLAYERS; i++) {
            this.playerList[i] = null;
        }

        this.setupWorldTick();
    }

    public setupWorldTick(): void {
        setInterval(async () => await this.worldTick(), World.TICK_LENGTH);
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
            player.activeGameInterface = null;

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
        let hrTime = process.hrtime();
        const startTime = hrTime[0] * 1000000 + hrTime[1] / 1000;
        const activePlayers: Player[] = this.playerList.filter(player => player !== null);

        if(activePlayers.length === 0) {
            return Promise.resolve();
        }

        const playerUpdateTasks = activePlayers.map(player => player.playerUpdateTask);

        await Promise.all(activePlayers.map(player => player.tick()));
        await Promise.all(playerUpdateTasks.map(task => task.execute()));
        await Promise.all(activePlayers.map(player => player.reset()));

        return Promise.resolve().then(() => {
            let hrTime = process.hrtime();
            const endTime = hrTime[0] * 1000000 + hrTime[1] / 1000;

            if(yargs.argv.tickTime) {
                logger.info(`World tick completed in ${endTime - startTime} microseconds.`);
            }
        });
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
        player.init();
        return true;
    }

    public deregisterPlayer(player: Player): void {
        this.playerList[player.worldIndex] = null;
    }

}
