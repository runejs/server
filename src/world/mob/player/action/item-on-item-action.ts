import { Player } from '@server/world/mob/player/player';
import { Item } from '@server/world/items/item';

/**
 * The definition for an item on item action function.
 */
export type itemOnItemAction = (details: ItemOnItemActionDetails) => void;

/**
 * Details about an item on item action.
 */
export interface ItemOnItemActionDetails {
    player: Player;
    usedItem: Item;
    usedWithItem: Item;
    usedSlot: number;
    usedWithSlot: number;
    usedInterfaceId: number;
    usedWithInterfaceId: number;
}

/**
 * Defines an item on item interaction plugin.
 */
export interface ItemOnItemActionPlugin {
    items: { item1: number, item2: number }[];
    action: itemOnItemAction;
}

/**
 * A directory of all item on item interaction plugins.
 */
let itemOnItemInteractions: ItemOnItemActionPlugin[] = [
];

/**
 * Sets the list of NPC interaction plugins.
 * @param plugins The plugin list.
 */
export const setItemOnItemPlugins = (plugins: ItemOnItemActionPlugin[]): void => {
    itemOnItemInteractions = plugins;
};

export const itemOnItemAction = (player: Player,
                                 usedItem: Item, usedSlot: number, usedInterfaceId: number,
                                 usedWithItem: Item, usedWithSlot: number, usedWithInterfaceId: number): void => {
    // Find all item on item action plugins that match this action
    const interactionPlugins = itemOnItemInteractions.filter(plugin =>
        plugin.items.findIndex(i => i.item1 === usedItem.itemId && i.item2 === usedWithItem.itemId) !== -1 ||
        plugin.items.findIndex(i => i.item2 === usedItem.itemId && i.item1 === usedWithItem.itemId) !== -1);

    if(interactionPlugins.length === 0) {
        player.packetSender.chatboxMessage(`Unhandled item on item interaction: ${usedItem.itemId} on ${usedWithItem.itemId}`);
        return;
    }

    player.actionsCancelled.next();

    // Immediately the plugins
    interactionPlugins.forEach(plugin => plugin.action({ player, usedItem, usedWithItem, usedSlot, usedWithSlot,
        usedInterfaceId, usedWithInterfaceId }));
};
