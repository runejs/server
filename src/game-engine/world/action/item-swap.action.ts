import { Player } from '../actor/player/player';
import { ActionHook, getActionHooks } from '@engine/world/action/hooks';
import { logger } from '@runejs/core';
import { numberHookFilter } from '@engine/world/action/hooks/hook-filters';
import { ActionPipe } from '@engine/world/action/index';


/**
 * Defines a swap items action hook.
 */
export interface ItemSwapActionHook extends ActionHook<itemSwapActionHandler> {
    widgetId?: number;
    widgetIds?: number[];
}


/**
 * The swap items action hook handler function to be called when the hook's conditions are met.
 */
export type itemSwapActionHandler = (itemSwapAction: ItemSwapAction) => void;


/**
 * Details about a swap items action being performed.
 */
export interface ItemSwapAction {
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
const itemSwapActionPipe = async (player: Player, fromSlot: number, toSlot: number, widget: { widgetId: number, containerId: number }): Promise<void> => {
    const swapItemsActions = getActionHooks<ItemSwapActionHook>('item_swap')
        .filter(plugin => numberHookFilter(plugin.widgetId || plugin.widgetIds, widget.widgetId));

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
export default [ 'item_swap', itemSwapActionPipe ] as ActionPipe;
