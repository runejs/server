import { Player } from '@engine/world/actor/player/player';
import { Item } from '@engine/world/items/item';
import { ActionHook, getActionHooks } from '@engine/world/action/hooks';
import { questHookFilter } from '@engine/world/action/hooks/hook-filters';
import { ActionPipe, RunnableHooks } from '@engine/world/action/index';


/**
 * Defines an item-on-item action hook.
 */
export interface ItemOnItemActionHook extends ActionHook<ItemOnItemAction, itemOnItemActionHandler> {
    // The item pairs being used. Each item can be used on the other, so item order does not matter.
    items: { item1: number, item2?: number }[];
}


/**
 * The item-on-item action hook handler function to be called when the hook's conditions are met.
 */
export type itemOnItemActionHandler = (itemOnItemAction: ItemOnItemAction) => void;


/**
 * Details about an item-on-item action being performed.
 */
export interface ItemOnItemAction {
    // The player performing the action.
    player: Player;
    // The item being used.
    usedItem: Item;
    // The item that the first item is being used on.
    usedWithItem: Item;
    // The container slot that the item being used is in.
    usedSlot: number;
    // The container slot that the second item is in.
    usedWithSlot: number;
    // The ID of the UI widget that the item being used is in.
    usedWidgetId: number;
    // The ID of the UI widget that the second item is in.
    usedWithWidgetId: number;
}


/**
 * The pipe that the game engine hands item-on-item actions off to.
 * @param player
 * @param usedItem
 * @param usedSlot
 * @param usedWidgetId
 * @param usedWithItem
 * @param usedWithSlot
 * @param usedWithWidgetId
 */
const itemOnItemActionPipe = (player: Player, usedItem: Item, usedSlot: number, usedWidgetId: number,
    usedWithItem: Item, usedWithSlot: number, usedWithWidgetId: number): RunnableHooks<ItemOnItemAction> => {
    if(player.busy) {
        return;
    }

    // Find all item on item action plugins that match this action
    let matchingHooks = getActionHooks<ItemOnItemActionHook>('item_on_item').filter(plugin =>
        questHookFilter(player, plugin) &&
        (plugin.items.findIndex(i => i.item1 === usedItem.itemId && i.item2 === usedWithItem.itemId) !== -1 ||
        plugin.items.findIndex(i => i.item2 === usedItem.itemId && i.item1 === usedWithItem.itemId) !== -1 ||
        plugin.items.findIndex(i => i.item1 === usedItem.itemId && !i.item2 || i.item1 === usedWithItem.itemId && !i.item2 )  !== -1));

    const questActions = matchingHooks.filter(plugin => plugin.questRequirement !== undefined);

    if(questActions.length !== 0) {
        matchingHooks = questActions;
    }

    if(matchingHooks.length === 0) {
        player.outgoingPackets.chatboxMessage(
            `Unhandled item on item interaction: ${usedItem.itemId} on ${usedWithItem.itemId}`);
        return null;
    }

    return {
        hooks: matchingHooks,
        action: {
            player, usedItem, usedWithItem, usedSlot, usedWithSlot,
            usedWidgetId: usedWidgetId, usedWithWidgetId: usedWithWidgetId
        }
    }
};


/**
 * Item-on-item action pipe definition.
 */
export default [ 'item_on_item', itemOnItemActionPipe ] as ActionPipe;
