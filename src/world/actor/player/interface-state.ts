import { Player } from '@server/world/actor/player/player';


export type GameInterfacePosition = 'gamescreen' | 'fullscreen' | 'chatbox' | 'tabarea';
export type GameInterfaceType = 'queued' | 'queued_solo' | 'multi' | 'solo';

export class GameInterface {
    interfaceId: number;
    position: GameInterfacePosition;
    type: GameInterfaceType;
    walkable: boolean;
}

export class InterfaceState {

    public readonly interfaces: { [key: string]: GameInterface };
    private readonly player: Player

    public constructor(player: Player) {
        this.interfaces = {
            'gamescreen': null,
            'fullscreen': null,
            'chatbox': null,
            'tabarea': null
        };
        this.player = player;
    }

    public showGameInterface(interfaceId: number, position: GameInterfacePosition,
        type: GameInterfaceType, walkable: boolean): void {
        const gameInterface = new GameInterface();
        gameInterface.interfaceId = interfaceId;
        gameInterface.position = position;
        gameInterface.type = type;
        gameInterface.walkable = walkable;
        this.showInterface(gameInterface);
    }

    public getInterface(position: GameInterfacePosition): GameInterface | null {
        return this.interfaces[position] || null;
    }

    private showInterface(gameInterface: GameInterface): void {
        this.interfaces[gameInterface.position] = gameInterface;
    }

    get gamescreenInterface(): GameInterface | null {
        return this.interfaces.gamescreen || null;
    }
    get fullscreenInterface(): GameInterface | null {
        return this.interfaces.fullscreen || null;
    }
    get chatboxInterface(): GameInterface | null {
        return this.interfaces.chatbox || null;
    }
    get tabareaInterface(): GameInterface | null {
        return this.interfaces.tabarea || null;
    }

}
