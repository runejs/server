import { Player } from '@server/world/actor/player/player';
import { ItemContainer } from '@server/world/items/item-container';


export type TabType = 'combat' | 'skills' | 'quests' | 'inventory' | 'equipment' | 'prayers' |
    'spells' | 'friends' | 'ignores' | 'logout' | 'emotes' | 'settings' | 'music';

export type GameInterfacePosition = 'screen' | 'full' | 'chatbox' | 'tabarea';


export const tabIndex: { [key: string]: number } = {
    'combat': 0,
    'skills': 1,
    'quests': 2,
    'inventory': 3,
    'equipment': 4,
    'prayers': 5,
    'spells': 6,
    'friends': 8,
    'ignores': 9,
    'logout': 10,
    'emotes': 11,
    'settings': 12,
    'music': 13
};


export interface GameInterfaceOptions {
    position: GameInterfacePosition;
    multi?: boolean;
    queued?: boolean;
    containerId?: number;
    container?: ItemContainer;
    walkable?: boolean;
}


export class GameInterface {

    public interfaceId: number;
    public position: GameInterfacePosition;
    public multi: boolean = false;
    public queued: boolean = false;
    public containerId: number;
    public container: ItemContainer = null;
    public walkable: boolean = false;

    public constructor(interfaceId: number, options: GameInterfaceOptions) {
        const { position, multi, queued, containerId, container, walkable } = options;

        this.interfaceId = interfaceId;
        this.position = position;
        this.multi = multi || false;
        this.queued = queued || false;
        this.containerId = containerId || -1;
        this.container = container || null;
        this.walkable = walkable || false;
    }

}


export class InterfaceState {

    public readonly tabs: { [key: string]: GameInterface | null };
    public readonly interfaces: { [key: string]: GameInterface | null };
    private readonly player: Player;

    public constructor(player: Player) {
        this.tabs = {
            'combat': null,
            'skills': null,
            'quests': null,
            'inventory': null,
            'equipment': null,
            'prayers': null,
            'spells': null,
            'friend': null,
            'ignores': null,
            'logout': null,
            'emotes': null,
            'settings': null,
            'music': null
        };

        this.interfaces = {
            'screen': null,
            'full': null,
            'chatbox': null,
            'tabarea': null
        };

        this.player = player;
    }

    public openInterface(interfaceId: number, options: GameInterfaceOptions): void {
        const gameInterface = new GameInterface(interfaceId, options);
        this.interfaces[gameInterface.position] = gameInterface;
        this.showInterface(gameInterface);
    }

    public setTab(type: TabType, gameInterface: GameInterface | number | null): void {
        if(gameInterface && typeof gameInterface === 'number') {
            // Create a new tab interface instance

            let container: ItemContainer | undefined;
            if(type === 'inventory') {
                container = this.player.inventory;
            } else if(type === 'equipment') {
                container = this.player.equipment;
            }

            gameInterface = new GameInterface(gameInterface, {
                position: 'tabarea',
                multi: true,
                walkable: true,
                container
            });
        }

        gameInterface = gameInterface as GameInterface || null;

        this.tabs[type] = gameInterface;
        this.player.outgoingPackets.sendTabWidget(tabIndex[type], gameInterface === null ? -1 : gameInterface.interfaceId);
    }

    public getTab(type: TabType): GameInterface | null {
        return this.tabs[type] || null;
    }

    public getInterface(position: GameInterfacePosition): GameInterface | null {
        return this.interfaces[position] || null;
    }

    private showInterface(gameInterface: GameInterface): void {
        // @TODO determine which packet to ship and then shipit
    }

    public get screenInterface(): GameInterface | null {
        return this.interfaces.screen || null;
    }

    public get fullScreenInterface(): GameInterface | null {
        return this.interfaces.full || null;
    }

    public get chatboxInterface(): GameInterface | null {
        return this.interfaces.chatbox || null;
    }

    public get tabareaInterface(): GameInterface | null {
        return this.interfaces.tabarea || null;
    }

}
