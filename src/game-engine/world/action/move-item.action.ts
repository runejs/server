import { Player } from '@engine/world/actor/player/player';
import { ActionHook, getActionHooks } from '@engine/world/action/hooks';
import { logger } from '@runejs/core';
import { numberHookFilter } from '@engine/world/action/hooks/hook-filters';
import { ActionPipe } from '@engine/world/action/index';


/**
 * Defines a move item action hook.
 */
export interface MoveItemActionHook extends ActionHook<moveItemActionHandler> {
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
const moveItemActionPipe = async (player: Player, fromSlot: number, toSlot: number, widget: { widgetId: number, containerId: number }): Promise<void> => {
    const moveItemActions = getActionHooks<MoveItemActionHook>('move_item')
        .filter(plugin => numberHookFilter(plugin.widgetId || plugin.widgetIds, widget.widgetId));

    if(!moveItemActions || moveItemActions.length === 0) {
        await player.sendMessage(`Unhandled Move Item action: widget[${widget.widgetId}] container[${widget.containerId}] fromSlot[${fromSlot} toSlot${toSlot}`);
    } else {
        try {
            moveItemActions.forEach(actionHook =>
                actionHook.handler({
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


/**
 * Move item action pipe definition.
 */
export default [ 'move_item', moveItemActionPipe ] as ActionPipe;
