import { Player } from '@engine/world/actor/player/player';
import { Position } from '@engine/world/position';
import { ActionHook, ActionPipe, getActionHooks } from '@engine/world/action/hooks';
import { logger } from '@runejs/core';
import { Item } from '@engine/world/items/item';
import { Npc } from '@engine/world/actor/npc/npc';
import { playerWalkTo } from '@engine/game-server';
import { advancedNumberFilter, questHookFilter } from '@engine/world/action/hook-filters';


/**
 * Defines an item-on-npc action hook.
 */
export interface ItemOnNpcActionHook extends ActionHook<itemOnNpcActionHandler> {
    // A single NPC ID or a list of NPC IDs that this action applies to.
    npcsIds: number | number[];
    // A single game item ID or a list of item IDs that this action applies to.
    itemIds: number | number[];
    // Whether or not the player needs to walk to this NPC before performing the action.
    walkTo: boolean;
}


/**
 * The item-on-npc action hook handler function to be called when the hook's conditions are met.
 */
export type itemOnNpcActionHandler = (itemOnNpcAction: ItemOnNpcAction) => void;


/**
 * Details about an item-on-npc action being performed.
 */
export interface ItemOnNpcAction {
    // The player performing the action.
    player: Player;
    // The NPC the action is being performed on.
    npc: Npc;
    // The position that the NPC was at when the action was initiated.
    position: Position;
    // The item being used.
    item: Item;
    // The ID of the UI widget that the item being used is in.
    itemWidgetId: number;
    // The ID of the UI container that the item being used is in.
    itemContainerId: number;
}


/**
 * The pipe that the game engine hands item-on-npc actions off to.
 * @param player
 * @param npc
 * @param position
 * @param item
 * @param itemWidgetId
 * @param itemContainerId
 */
const itemOnNpcActionPipe = (player: Player, npc: Npc, position: Position, item: Item,
    itemWidgetId: number, itemContainerId: number): void => {
    if(player.busy) {
        return;
    }

    // Find all item on npc action plugins that reference this npc and item
    let interactionActions = getActionHooks<ItemOnNpcActionHook>('item_on_npc_action').filter(plugin =>
        questHookFilter(player, plugin) &&
        advancedNumberFilter(plugin.npcsIds, npc.id) && advancedNumberFilter(plugin.itemIds, item.itemId));
    const questActions = interactionActions.filter(plugin => plugin.questRequirement !== undefined);

    if(questActions.length !== 0) {
        interactionActions = questActions;
    }

    if(interactionActions.length === 0) {
        player.outgoingPackets.chatboxMessage(`Unhandled item on npc interaction: ${ item.itemId } on ${ npc.name } ` +
            `(id-${ npc.id }) @ ${ position.x },${ position.y },${ position.level }`);
        return;
    }

    player.actionsCancelled.next(null);

    // Separate out walk-to actions from immediate actions
    const walkToPlugins = interactionActions.filter(plugin => plugin.walkTo);
    const immediateHooks = interactionActions.filter(plugin => !plugin.walkTo);

    // Make sure we walk to the npc before running any of the walk-to plugins
    if(walkToPlugins.length !== 0) {
        playerWalkTo(player, position)
            .then(() => {
                player.face(position);

                walkToPlugins.forEach(plugin =>
                    plugin.handler({
                        player,
                        npc,
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
            npc,
            position,
            item,
            itemWidgetId,
            itemContainerId
        });
    }
};


/**
 * Item-on-npc action pipe definition.
 */
export default [
    'item_on_npc_action',
    itemOnNpcActionPipe
] as ActionPipe;
