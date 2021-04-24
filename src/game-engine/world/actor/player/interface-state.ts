import { Player } from '@engine/world/actor/player/player';
import { ItemContainer } from '@engine/world/items/item-container';
import { lastValueFrom, Subject } from 'rxjs';
import { filter, take } from 'rxjs/operators';


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
    fakeWidget?: number;
    metadata?: { [key: string]: any };
}


export class Widget {

    public widgetId: number;
    public slot: GameInterfaceSlot;
    public multi: boolean = false;
    public queued: boolean = false;
    public containerId: number;
    public container: ItemContainer = null;
    public fakeWidget?: number;
    public metadata: { [key: string]: any };

    public constructor(interfaceId: number, options: WidgetOptions) {
        const { slot, multi, queued, containerId, container, fakeWidget, metadata } = options;

        this.widgetId = interfaceId;
        this.fakeWidget = fakeWidget;
        this.slot = slot;
        this.multi = multi || false;
        this.queued = queued || false;
        this.containerId = containerId || -1;
        this.container = container || null;
        this.metadata = { ...metadata }
    }

}

export interface WidgetClosedEvent {
    widget: Widget;
    widgetId?: number;
    data?: number;
}

/**
 * Control's a Player's Game Interface state.
 */
export class InterfaceState {

    public readonly tabs: { [key: string]: Widget | null };
    public readonly widgetSlots: { [key: string]: Widget | null };
    public readonly closed: Subject<WidgetClosedEvent> = new Subject<WidgetClosedEvent>();
    private readonly player: Player;
    private _screenOverlayWidget: number | null;
    private _chatOverlayWidget: number | null;

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
        this._screenOverlayWidget = null;
        this._chatOverlayWidget = null;
        this.clearSlots();

        this.player = player;
    }

    public openChatOverlayWidget(widgetId: number): void {
        this._chatOverlayWidget = widgetId;
        this.player.outgoingPackets.showChatDialogue(widgetId);
    }

    public closeChatOverlayWidget(): void {
        this._chatOverlayWidget = null;
        this.player.outgoingPackets.showChatDialogue(-1);
    }

    public openScreenOverlayWidget(widgetId: number): void {
        this._screenOverlayWidget = widgetId;
        this.player.outgoingPackets.showScreenOverlayWidget(widgetId);
    }

    public closeScreenOverlayWidget(): void {
        this._screenOverlayWidget = null;
        this.player.outgoingPackets.showScreenOverlayWidget(-1);
    }

    public async widgetClosed(slot: GameInterfaceSlot): Promise<WidgetClosedEvent> {
        return await lastValueFrom(this.closed.asObservable().pipe(
            filter(event => event.widget.slot === slot)).pipe(take(1)));
    }

    public closeWidget(slot: GameInterfaceSlot, widgetId?: number, data?: number): void {
        const widget: Widget | null = (slot ? this.widgetSlots[slot] : this.findWidget(widgetId)) || null;

        if(!widget) {
            return;
        }

        this.closed.next({ widget, widgetId, data });
        this.widgetSlots[widget.slot] = null;
    }

    public openWidget(widgetId: number, options: WidgetOptions): Widget {
        // if(this.widgetOpen(options.slot, widgetId)) {
        //     return;
        // }

        const widget = new Widget(widgetId, options);

        if(widget.queued) {
            // @TODO queued widgets
        }

        if(widget.slot === 'full' || !widget.multi) {
            this.clearSlots();
        }

        this.widgetSlots[widget.slot] = widget;
        this.showWidget(widget);
        return widget;
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

    public findWidget(widgetId: number): Widget | null {
        const slots: GameInterfaceSlot[] = Object.keys(this.widgetSlots) as GameInterfaceSlot[];
        let widget: Widget;
        slots.forEach(slot => {
            if(this.widgetSlots[slot]?.widgetId === widgetId) {
                widget = this.widgetSlots[slot];
            }
        });
        return widget || null;
    }

    public widgetOpen(slot?: GameInterfaceSlot, widgetId?: number): boolean {
        if(!slot) {
            const slots: GameInterfaceSlot[] = Object.keys(this.widgetSlots) as GameInterfaceSlot[];
            return slots.some(s => this.getWidget(s) !== null);
        }

        if(widgetId === undefined) {
            return this.getWidget(slot) !== null;
        } else {
            return this.getWidget(slot)?.widgetId === widgetId;
        }
    }

    public getWidget(slot: GameInterfaceSlot): Widget | null {
        return this.widgetSlots[slot] || null;
    }

    public closeAllSlots(): void {
        const slots: GameInterfaceSlot[] = Object.keys(this.widgetSlots) as GameInterfaceSlot[];
        slots.forEach(slot => this.closeWidget(slot));
        this.player.outgoingPackets.closeActiveWidgets();
    }

    private showWidget(widget: Widget): void {
        const { outgoingPackets: packets } = this.player;
        const { widgetId, containerId, slot, multi } = widget;

        if(slot === 'full' || !multi) {
            this.closeOthers(slot);
        }

        if(slot === 'full' && containerId !== undefined) {
            packets.showFullscreenWidget(widgetId, containerId);
        } else if(slot === 'screen') {
            const tabWidget = this.getWidget('tabarea');
            if(multi && tabWidget) {
                packets.showScreenAndTabWidgets(widgetId, tabWidget.widgetId);
            } else {
                packets.showStandaloneScreenWidget(widgetId);
            }
        } else if(slot === 'chatbox') {
            if(multi) {
                // Dialogue Widget
                packets.showChatDialogue(widgetId);
            } else {
                // Chatbox Widget
                packets.showChatboxWidget(widgetId);
            }
        } else if(slot === 'tabarea') {
            const screenWidget = this.getWidget('screen');
            if(multi) {
                packets.showScreenAndTabWidgets(screenWidget.widgetId, widgetId);
            } else {
                packets.showTabWidget(widgetId);
            }
        }
    }

    private closeOthers(openSlot: GameInterfaceSlot): void {
        const slots: GameInterfaceSlot[] = Object.keys(this.widgetSlots)
            .filter(slot => slot !== openSlot) as GameInterfaceSlot[];
        slots.forEach(slot => this.closeWidget(slot));
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

    public get screenOverlayWidget(): number | null {
        return this._screenOverlayWidget;
    }
}
