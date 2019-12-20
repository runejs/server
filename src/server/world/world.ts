import { Player } from './entity/mob/player/player';

/**
 * Controls the game world and all entities within it.
 */
export class World {

    public static readonly MAX_PLAYERS = 1000;
    public static readonly TICK_LENGTH = 600;

    public readonly playerList: Player[] = new Array(World.MAX_PLAYERS);

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

        const playerTickTasks = activePlayers.map(player => player.playerTickTask);
        const playerUpdateTasks = activePlayers.map(player => player.playerUpdateTask);
        const playerResetTasks = activePlayers.map(player => player.playerResetTask);

        await Promise.all(playerTickTasks.map(task => task.execute()));
        await Promise.all(playerUpdateTasks.map(task => task.execute()));
        await Promise.all(playerResetTasks.map(task => task.execute()));

        return Promise.resolve();
    }

    public registerPlayer(player: Player): boolean {
        const index = this.playerList.findIndex(p => p === null);

        if(index === -1) {
            console.log('World full!');
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
