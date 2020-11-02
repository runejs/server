import { Player } from '../actor/player/player';
import { Action, getActionList } from '@server/world/action/index';
import { basicNumberFilter } from '@server/plugins/plugin-loader';
import { logger } from '@runejs/core';


/**
 * The definition for a Swap Items action function.
 */
export type swapItemsAction = (swapItemsActionData: SwapItemsActionData) => void;

/**
 * Details about a pair of items being swapped.
 */
export interface SwapItemsActionData {
    // The player performing the action.
    player: Player;
    // The widget id for the container.
    widgetId: number;
    // The container id within the widget.
    containerId: number;
    // The slot of the item being swapped item.
    fromSlot: number;
    // The slot of the item being swapped with.
    toSlot: number;
}

/**
 * Defines a Swap Items action.
 */
export interface SwapItemsAction extends Action {
    widgetId?: number;
    widgetIds?: number[];
    action: swapItemsAction;
}

const swapItemsActionHandler = async (player: Player, fromSlot: number, toSlot: number, widget: { widgetId: number, containerId: number }): Promise<void> => {
    const swapItemsActions = getActionList('swap_items')
        .filter(plugin => basicNumberFilter(plugin.widgetId || plugin.widgetIds, widget.widgetId));

    if(!swapItemsActions || swapItemsActions.length === 0) {
        await player.sendMessage(`Unhandled Swap Items action: widget[${widget.widgetId}] container[${widget.containerId}] fromSlot[${fromSlot} toSlot${toSlot}`);
    } else {
        try {
            swapItemsActions.forEach(plugin =>
                plugin.action({
                    player,
                    widgetId: widget.widgetId,
                    containerId: widget.containerId,
                    fromSlot,
                    toSlot
                }));
        } catch(error) {
            logger.error(`Error handling Swap Items action.`);
            logger.error(error);
        }
    }
};

export default {
    action: 'swap_items',
    handler: swapItemsActionHandler
};
