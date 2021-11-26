import { Player } from '@engine/world/actor';
import { Item } from '@engine/world';
import { ActionHook, getActionHooks, questHookFilter, ActionPipe, RunnableHooks } from '@engine/action';


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
    let matchingHooks = getActionHooks<ItemOnItemActionHook>('item_on_item', plugin => {
        if(questHookFilter(player, plugin)) {
            const used = usedItem.itemId;
            const usedWith = usedWithItem.itemId;

            return (plugin.items.some(({ item1, item2 }) => {
                const items = [ item1, item2 ];
                return items.includes(used) && items.includes(usedWith);
            }));
        }

        return false;
    });

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
