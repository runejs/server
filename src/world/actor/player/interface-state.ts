import { Player } from '@server/world/actor/player/player';
import { ItemContainer } from '@server/world/items/item-container';
import { Subject, lastValueFrom } from 'rxjs';


export type TabType = 'combat' | 'skills' | 'quests' | 'inventory' | 'equipment' | 'prayers' |
    'spells' | 'friends' | 'ignores' | 'logout' | 'emotes' | 'settings' | 'music';

export type GameInterfaceSlot = 'full' | 'screen' | 'chatbox' | 'tabarea';


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


export interface WidgetOptions {
    slot: GameInterfaceSlot;
    multi?: boolean;
    queued?: boolean;
    containerId?: number;
    container?: ItemContainer;
    walkable?: boolean;
}


export class Widget {

    public widgetId: number;
    public slot: GameInterfaceSlot;
    public multi: boolean = false;
    public queued: boolean = false;
    public containerId: number;
    public container: ItemContainer = null;
    public walkable: boolean = false;

    public constructor(interfaceId: number, options: WidgetOptions) {
        const { slot, multi, queued, containerId, container, walkable } = options;

        this.widgetId = interfaceId;
        this.slot = slot;
        this.multi = multi || false;
        this.queued = queued || false;
        this.containerId = containerId || -1;
        this.container = container || null;
        this.walkable = walkable || false;
    }

}


export class InterfaceState {

    public readonly tabs: { [key: string]: Widget | null };
    public readonly widgetSlots: { [key: string]: Widget | null };
    public readonly closed: Subject<Widget> = new Subject<Widget>();
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
            'friends': null,
            'ignores': null,
            'logout': null,
            'emotes': null,
            'settings': null,
            'music': null
        };

        this.widgetSlots = {};
        this.clearSlots();

        this.player = player;
    }

    public async widgetClosed(slot: GameInterfaceSlot): Promise<Widget> {
        const widget = this.widgetSlots[slot];
        if(!widget) {
            return null;
        }

        return await lastValueFrom(this.closed.asObservable());
    }

    public closeWidget(slot: GameInterfaceSlot): void {
        const widget = this.widgetSlots[slot];
        if(!widget) {
            return;
        }

        this.closed.next(widget);
        this.widgetSlots[slot] = null;
    }

    public openWidget(widgetId: number, options: WidgetOptions): void {
        const widget = new Widget(widgetId, options);

        if(widget.queued) {
            // @TODO queued widgets
        }

        if(widget.slot === 'full' || !widget.multi) {
            this.clearSlots();
        }

        this.widgetSlots[widget.slot] = widget;
        this.showWidget(widget);
    }

    public setTab(type: TabType, widget: Widget | number | null): void {
        if(widget && typeof widget === 'number') {
            // Create a new tab interface instance

            let container: ItemContainer | undefined;
            if(type === 'inventory') {
                container = this.player.inventory;
            } else if(type === 'equipment') {
                container = this.player.equipment;
            }

            widget = new Widget(widget, {
                slot: 'tabarea',
                multi: true,
                walkable: true,
                container
            });
        }

        widget = widget as Widget || null;

        this.tabs[type] = widget;
        this.player.outgoingPackets.sendTabWidget(tabIndex[type], widget === null ? -1 : widget.widgetId);
    }

    public getTab(type: TabType): Widget | null {
        return this.tabs[type] || null;
    }

    public getWidget(slot: GameInterfaceSlot): Widget | null {
        return this.widgetSlots[slot] || null;
    }

    private showWidget(widget: Widget): void {
        if(widget.slot === 'full' && widget.containerId !== undefined) {
            this.player.outgoingPackets.showFullscreenWidget(widget.widgetId, widget.containerId);
        } else if(widget.slot === 'screen') {

        } else if(widget.slot === 'chatbox') {

        } else if(widget.slot === 'tabarea') {

        }
    }

    private clearSlots(): void {
        this.widgetSlots.full = null;
        this.widgetSlots.screen = null;
        this.widgetSlots.chatbox = null;
        this.widgetSlots.tabarea = null;
    }

    public get fullScreenWidget(): Widget | null {
        return this.widgetSlots.full || null;
    }

    public get screenWidget(): Widget | null {
        return this.widgetSlots.screen || null;
    }

    public get chatboxWidget(): Widget | null {
        return this.widgetSlots.chatbox || null;
    }

    public get tabareaWidget(): Widget | null {
        return this.widgetSlots.tabarea || null;
    }

}
