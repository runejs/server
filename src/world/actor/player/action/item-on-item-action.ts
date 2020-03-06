import { Player } from '@server/world/actor/player/player';
import { Item } from '@server/world/items/item';
import { ActionPlugin, questFilter } from '@server/plugins/plugin';

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
    usedWidgetId: number;
    usedWithWidgetId: number;
}

/**
 * Defines an item on item interaction plugin.
 */
export interface ItemOnItemActionPlugin extends ActionPlugin {
    items: { item1: number, item2: number }[];
    action: itemOnItemAction;
}

/**
 * A directory of all item on item interaction plugins.
 */
let itemOnItemInteractions: ItemOnItemActionPlugin[] = [
];

/**
 * Sets the list of item on item interaction plugins.
 * @param plugins The plugin list.
 */
export const setItemOnItemPlugins = (plugins: ActionPlugin[]): void => {
    itemOnItemInteractions = plugins as ItemOnItemActionPlugin[];
};

export const itemOnItemAction = (player: Player,
                                 usedItem: Item, usedSlot: number, usedWidgetId: number,
                                 usedWithItem: Item, usedWithSlot: number, usedWithWidgetId: number): void => {
    if(player.busy) {
        return;
    }

    // Find all item on item action plugins that match this action
    let interactionActions = itemOnItemInteractions.filter(plugin =>
        questFilter(player, plugin) &&
        (plugin.items.findIndex(i => i.item1 === usedItem.itemId && i.item2 === usedWithItem.itemId) !== -1 ||
        plugin.items.findIndex(i => i.item2 === usedItem.itemId && i.item1 === usedWithItem.itemId) !== -1));
    const questActions = interactionActions.filter(plugin => plugin.quest !== undefined);

    if(questActions.length !== 0) {
        interactionActions = questActions;
    }

    if(interactionActions.length === 0) {
        player.outgoingPackets.chatboxMessage(`Unhandled item on item interaction: ${usedItem.itemId} on ${usedWithItem.itemId}`);
        return;
    }

    player.actionsCancelled.next();

    // Immediately run the plugins
    for(const plugin of interactionActions) {
        plugin.action({ player, usedItem, usedWithItem, usedSlot, usedWithSlot,
            usedWidgetId: usedWidgetId, usedWithWidgetId: usedWithWidgetId });
    }
};
