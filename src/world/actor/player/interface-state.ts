import { Player } from '@server/world/actor/player/player';
import { ItemContainer } from '@server/world/items/item-container';


export type TabType = 'combat_options' | 'skills' | 'quests' | 'inventory' | 'equipment' | 'prayers' |
    'spellbook' | 'friends_list' | 'ignore_list' | 'logout' | 'emotes' | 'game_settings' | 'music_player';
export type GameInterfacePosition = 'gamescreen' | 'fullscreen' | 'chatbox' | 'tabarea';
export type GameInterfaceType = 'queued' | 'queued_solo' | 'multi' | 'solo';

export const tabIndex: { [key: string]: number } = {
    'combat_options': 0,
    'skills': 1,
    'quests': 2,
    'inventory': 3,
    'equipment': 4,
    'prayers': 5,
    'spellbook': 6,
    'friends_list': 8,
    'ignore_list': 9,
    'logout': 10,
    'emotes': 11,
    'game_settings': 12,
    'music_player': 13
};

export class GameInterface {

    public interfaceId: number;
    public position: GameInterfacePosition;
    public type: GameInterfaceType;
    public container: ItemContainer = null;
    public walkable: boolean = false;

    public constructor(interfaceId: number, position: GameInterfacePosition, type: GameInterfaceType = 'multi',
        container: ItemContainer = null, walkable: boolean = false) {
        this.interfaceId = interfaceId;
        this.position = position;
        this.type = type;
        this.container = container;
        this.walkable = walkable;
    }

}


export class InterfaceState {

    public readonly tabs: { [key: string]: GameInterface };
    public readonly interfaces: { [key: string]: GameInterface };
    private readonly player: Player

    public constructor(player: Player) {
        this.tabs = {
            'combat_options': null,
            'skills': null,
            'quests': null,
            'inventory': null,
            'equipment': null,
            'prayers': null,
            'spellbook': null,
            'friends_list': null,
            'ignore_list': null,
            'logout': null,
            'emotes': null,
            'game_settings': null,
            'music_player': null
        };
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
        this.showInterface(new GameInterface(interfaceId, position, type, null, walkable));
    }

    public setTab(type: TabType, gameInterface: GameInterface): void {
        this.tabs[type] = gameInterface;
    }

    public getTab(type: TabType): GameInterface | null {
        return this.tabs[type] || null;
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
