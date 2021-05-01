import { Player } from '@engine/world/actor/player/player';
import { ActionHook, getActionHooks } from '@engine/world/action/hooks';
import { logger } from '@runejs/core';
import { numberHookFilter } from '@engine/world/action/hooks/hook-filters';
import { ActionPipe, RunnableHooks } from '@engine/world/action/index';


/**
 * Defines a move item action hook.
 */
export interface MoveItemActionHook extends ActionHook<MoveItemAction, moveItemActionHandler> {
    widgetId?: number;
    widgetIds?: number[];
}


/**
 * The move item action hook handler function to be called when the hook's conditions are met.
 */
export type moveItemActionHandler = (moveItemAction: MoveItemAction) => void;


/**
 * Details about a move item action being performed.
 */
export interface MoveItemAction {
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
 * The pipe that the game engine hands move item actions off to.
 * @param player
 * @param fromSlot
 * @param toSlot
 * @param widget
 */
const moveItemActionPipe = (player: Player, fromSlot: number, toSlot: number,
                            widget: { widgetId: number, containerId: number }): RunnableHooks<MoveItemAction> => {
    const matchingHooks = getActionHooks<MoveItemActionHook>('move_item')
        .filter(plugin => numberHookFilter(plugin.widgetId || plugin.widgetIds, widget.widgetId));

    if(!matchingHooks || matchingHooks.length === 0) {
        player.sendMessage(`Unhandled Move Item action: widget[${widget.widgetId}] container[${widget.containerId}] fromSlot[${fromSlot} toSlot${toSlot}`);
        return null;
    }

    return {
        hooks: matchingHooks,
        action: {
            player,
            widgetId: widget.widgetId,
            containerId: widget.containerId,
            fromSlot,
            toSlot
        }
    };
};


/**
 * Move item action pipe definition.
 */
export default [ 'move_item', moveItemActionPipe ] as ActionPipe;
