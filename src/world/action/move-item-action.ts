import { Player } from '@server/world/actor/player/player';
import { widgets } from '@server/world/config/widget';
import { Action } from '@server/world/action/index';

/**
 * The definition for a Move Item action function.
 */
export type moveItemAction = (moveItemActionData: MoveItemActionData) => void;

/**
 * Details about an item being moved.
 */
export interface MoveItemActionData {
    // The player performing the action.
    player: Player;
    // The widget id for the container.
    widgetId: number;
    // The original slot of the item.
    fromSlot: number;
    // The new slot for the item.
    toSlot: number;
}

/**
 * Defines a Move Item action.
 */
export interface MoveItemAction extends Action {
    widgetId?: number;
    widgetIds?: number[];
    action: moveItemAction;
}

const moveItemActionHandler = (player: Player, fromSlot: number, toSlot: number, widget: { widgetId: number, containerId: number }) => {
    if(widget.widgetId === widgets.bank.screenWidget.widgetId && widget.containerId === widgets.bank.screenWidget.containerId) {
        const bank = player.bank;

        if(toSlot > bank.size - 1 || fromSlot > bank.size - 1) {
            return;
        }

        if(fromSlot < toSlot) {
            let slot = toSlot;
            let current = bank.remove(fromSlot);
            while(slot >= fromSlot) {
                const temp = bank.remove(slot);
                bank.set(slot, current);
                current = temp;
                slot--;
            }
        } else {
            let slot = toSlot;
            let current = bank.remove(fromSlot);
            while(slot <= fromSlot) {
                const temp = bank.remove(slot);
                bank.set(slot, current);
                current = temp;
                slot++;
            }
        }

        player.outgoingPackets.sendUpdateAllWidgetItems(widgets.bank.screenWidget, player.bank);
    }
};

export default {
    action: 'move_item',
    handler: moveItemActionHandler
};
