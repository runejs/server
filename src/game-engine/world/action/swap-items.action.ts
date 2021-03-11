import { Player } from '../actor/player/player';
import { ActionHook, getActionHooks } from '@engine/world/action/hooks';
import { logger } from '@runejs/core';
import { basicNumberFilter } from '@engine/world/action/hook-filters';


/**
 * Defines a swap items action hook.
 */
export interface SwapItemsActionHook extends ActionHook<swapItemsActionHandler> {
    widgetId?: number;
    widgetIds?: number[];
}


/**
 * The swap items action hook handler function to be called when the hook's conditions are met.
 */
export type swapItemsActionHandler = (swapItemsAction: SwapItemsAction) => void;


/**
 * Details about a swap items action being performed.
 */
export interface SwapItemsAction {
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
 * The pipe that the game engine hands swap items actions off to.
 * @param player
 * @param fromSlot
 * @param toSlot
 * @param widget
 */
const swapItemsActionPipe = async (player: Player, fromSlot: number, toSlot: number, widget: { widgetId: number, containerId: number }): Promise<void> => {
    const swapItemsActions = getActionHooks<SwapItemsActionHook>('swap_items_action')
        .filter(plugin => basicNumberFilter(plugin.widgetId || plugin.widgetIds, widget.widgetId));

    if(!swapItemsActions || swapItemsActions.length === 0) {
        await player.sendMessage(`Unhandled Swap Items action: widget[${widget.widgetId}] container[${widget.containerId}] fromSlot[${fromSlot} toSlot${toSlot}`);
    } else {
        try {
            swapItemsActions.forEach(plugin =>
                plugin.handler({
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


/**
 * Swap items action pipe definition.
 */
export default [ 'swap_items_action', swapItemsActionPipe ];
