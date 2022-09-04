import { Player } from '@engine/world/actor';
import { Item, WorldItem } from '@engine/world';
import { ActionHook, getActionHooks, questHookFilter, ActionPipe, RunnableHooks } from '@engine/action';


/**
 * Defines an item-on-item action hook.
 *
 * @author jameskmonger
 */
export interface ItemOnGroundItemActionHook extends ActionHook<ItemOnGroundItemAction, itemOnGroundItemActionHandler> {
    /**
     * The item pairs being used. Both items are optional so that you can specify a single item, a pair of items, or neither.
     */
    items: { item?: number, groundItem?: number }[];
}


/**
 * The item-on-ground-item action hook handler function to be called when the hook's conditions are met.
 */
export type itemOnGroundItemActionHandler = (itemOnGroundItemAction: ItemOnGroundItemAction) => void;


/**
 * Details about an item-on-ground-item action being performed.
 *
 * @author jameskmonger
 */
export interface ItemOnGroundItemAction {
    /**
     * The player performing the action.
     */
    player: Player;

    /**
     * The item being used.
     */
    usedItem: Item;

    /**
     * The WorldItem that the first item is being used on.
     */
    usedWithItem: WorldItem;

    /**
     * The ID of the UI widget that the item being used is in.
     */
    usedWidgetId: number;

    /**
     * The ID of the container that the item being used is in.
     */
    usedContainerId: number;

    /**
     * The slot within the container that the item being used is in.
     */
    usedSlot: number;
}

/**
 * The pipe that the game engine hands item-on-ground-item actions off to.
 *
 * This will call the `item_on_ground_item` action hooks, if any are registered and match the action being performed.
 *
 * Both `item` and `groundItem` are optional, but if they are provided then they must match the items in use.
 *
 * @author jameskmonger
 */
const itemOnGroundItemActionPipe = (
    player: Player,
    usedItem: Item, usedWithItem: WorldItem,
    usedWidgetId: number, usedContainerId: number, usedSlot: number
): RunnableHooks<ItemOnGroundItemAction> => {
    if(player.busy) {
        return;
    }

    // Find all item on item action plugins that match this action
    let matchingHooks = getActionHooks<ItemOnGroundItemActionHook>('item_on_ground_item', plugin => {
        if(questHookFilter(player, plugin)) {
            const used = usedItem.itemId;
            const usedWith = usedWithItem.itemId;

            return (plugin.items.some(({ item, groundItem }) => {
                const itemMatch = item === undefined || item === used;
                const groundItemMatch = groundItem === undefined || groundItem === usedWith;

                return itemMatch && groundItemMatch;
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
            `Unhandled item on ground item interaction: ${usedItem.itemId} on ${usedWithItem.itemId}`);
        return null;
    }

    return {
        hooks: matchingHooks,
        action: {
            player,
            usedItem, usedWithItem,
            usedWidgetId, usedContainerId, usedSlot
        }
    }
};


/**
 * Item-on-item action pipe definition.
 */
export default [ 'item_on_ground_item', itemOnGroundItemActionPipe ] as ActionPipe;
