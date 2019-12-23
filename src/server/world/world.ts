import { Player } from './entity/mob/player/player';
import { ChunkManager } from './map/chunk-manager';
import { logger } from '../util/logger';

/**
 * Controls the game world and all entities within it.
 */
export class World {

    public static readonly MAX_PLAYERS = 1000;
    public static readonly TICK_LENGTH = 600;

    public readonly playerList: Player[] = new Array(World.MAX_PLAYERS);
    public readonly chunkManager: ChunkManager = new ChunkManager();

    public constructor() {
        for(let i = 0; i < World.MAX_PLAYERS; i++) {
            this.playerList[i] = null;
        }

        this.setupWorldTick();
    }

    public setupWorldTick(): void {
        setInterval(async () => await this.worldTick(), World.TICK_LENGTH);
    }

    public async worldTick(): Promise<void> {
        const activePlayers: Player[] = this.playerList.filter(player => player !== null);

        if(activePlayers.length === 0) {
            return Promise.resolve();
        }

        const playerUpdateTasks = activePlayers.map(player => player.playerUpdateTask);

        await Promise.all(activePlayers.map(player => player.tick()));
        await Promise.all(playerUpdateTasks.map(task => task.execute()));
        await Promise.all(activePlayers.map(player => player.reset()));

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
        player.init();
        return true;
    }

    public deregisterPlayer(player: Player): void {
        this.playerList[player.worldIndex] = null;
    }

}
