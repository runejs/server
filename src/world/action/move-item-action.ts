import { Player } from '@server/world/actor/player/player';
import { Action, getActionList } from '@server/world/action/index';
import { basicNumberFilter } from '@server/plugins/plugin-loader';
import { logger } from '@runejs/core';

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
    // The container id within the widget.
    containerId: number;
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

const moveItemActionHandler = async (player: Player, fromSlot: number, toSlot: number, widget: { widgetId: number, containerId: number }): Promise<void> => {
    const moveItemActions = getActionList('move_item')
        .filter(plugin => basicNumberFilter(plugin.widgetId || plugin.widgetIds, widget.widgetId));

    if(!moveItemActions || moveItemActions.length === 0) {
        await player.sendMessage(`Unhandled Move Item action: widget[${widget.widgetId}] container[${widget.containerId}] fromSlot[${fromSlot} toSlot${toSlot}`);
    } else {
        try {
            moveItemActions.forEach(plugin =>
                plugin.action({
                    player,
                    widgetId: widget.widgetId,
                    containerId: widget.containerId,
                    fromSlot,
                    toSlot
                }));
        } catch(error) {
            logger.error(`Error handling Move Item action.`);
            logger.error(error);
        }
    }
};

export default {
    action: 'move_item',
    handler: moveItemActionHandler
};
