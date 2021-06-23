import { Player } from '@engine/world/actor/player/player';
import { Position } from '@engine/world/position';
import { ActionHook, getActionHooks } from '@engine/world/action/hooks';
import { logger } from '@runejs/core';
import { Item } from '@engine/world/items/item';
import { playerWalkTo } from '@engine/game-server';
import { advancedNumberHookFilter, questHookFilter } from '@engine/world/action/hooks/hook-filters';
import { ActionPipe } from '@engine/world/action/index';


/**
 * Defines an item-on-player action hook.
 */
export interface ItemOnPlayerActionHook extends ActionHook<itemOnPlayerActionHandler> {
    // A single game item ID or a list of item IDs that this action applies to.
    itemIds: number | number[];
    // Whether or not the player needs to walk to this Player before performing the action.
    walkTo: boolean;
}


/**
 * The item-on-player action hook handler function to be called when the hook's conditions are met.
 */
export type itemOnPlayerActionHandler = (itemOnPlayerAction: ItemOnPlayerAction) => void;


/**
 * Details about an item-on-player action being performed.
 */
export interface ItemOnPlayerAction {
    // The player performing the action.
    player: Player;
    // The player the action is being performed on.
    otherPlayer: Player;
    // The position that the Player was at when the action was initiated.
    position: Position;
    // The item being used.
    item: Item;
    // The ID of the UI widget that the item being used is in.
    itemWidgetId: number;
    // The ID of the UI container that the item being used is in.
    itemContainerId: number;
}


// @TODO update
/**
 * The pipe that the game engine hands item-on-player actions off to.
 * @param player
 * @param otherPlayer
 * @param position
 * @param item
 * @param itemWidgetId
 * @param itemContainerId
 */
const itemOnPlayerActionPipe = (player: Player, otherPlayer: Player, position: Position, item: Item,
    itemWidgetId: number, itemContainerId: number): void => {
    if(player.busy) {
        return;
    }

    // Find all item on player action plugins that reference this item
    let interactionActions = getActionHooks<ItemOnPlayerActionHook>('item_on_player').filter(plugin =>
        questHookFilter(player, plugin) && advancedNumberHookFilter(plugin.itemIds, item.itemId));
    const questActions = interactionActions.filter(plugin => plugin.questRequirement !== undefined);

    if(questActions.length !== 0) {
        interactionActions = questActions;
    }

    if(interactionActions.length === 0) {
        player.outgoingPackets.chatboxMessage(`Unhandled item on player interaction: ${ item.itemId } ` +
            `@ ${ position.x },${ position.y },${ position.level }`);
        return;
    }

    // Separate out walk-to actions from immediate actions
    const walkToPlugins = interactionActions.filter(plugin => plugin.walkTo);
    const immediateHooks = interactionActions.filter(plugin => !plugin.walkTo);

    // Make sure we walk to the player before running any of the walk-to plugins
    if(walkToPlugins.length !== 0) {
        playerWalkTo(player, position)
            .then(() => {
                player.face(position);

                walkToPlugins.forEach(plugin =>
                    plugin.handler({
                        player,
                        otherPlayer,
                        position,
                        item,
                        itemWidgetId,
                        itemContainerId
                    }));
            })
            .catch(() => logger.warn(`Unable to complete walk-to action.`));
    }

    // Immediately run any non-walk-to plugins
    for(const actionHook of immediateHooks) {
        actionHook.handler({
            player,
            otherPlayer,
            position,
            item,
            itemWidgetId,
            itemContainerId
        });
    }
};


/**
 * Item-on-player action pipe definition.
 */
export default [ 'item_on_player', itemOnPlayerActionPipe ] as ActionPipe;
