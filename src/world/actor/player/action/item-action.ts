import { Player } from '@server/world/actor/player/player';
import { Action, questFilter } from '@server/plugins/plugin';
import { ItemContainer } from '@server/world/items/item-container';
import { Item } from '@server/world/items/item';
import { basicNumberFilter, basicStringFilter } from '@server/plugins/plugin-loader';
import { World, world } from '@server/game-server';
import { ItemDetails } from '@server/world/config/item-data';

/**
 * The definition for an item action function.
 */
export type itemAction = (itemActionData: ItemActionData) => void;

/**
 * Details about an item being interacted with.
 */
export interface ItemActionData {
    // The player performing the action.
    player: Player;
    // The ID of the item being interacted with.
    itemId: number;
    // The container slot that the item being interacted with is in.
    itemSlot: number;
    // The ID of the UI widget that the item is in.
    widgetId: number;
    // The ID of the UI container that the item is in.
    containerId: number;
    // Additional details about the item.
    itemDetails: ItemDetails;
    // The option that the player used (ie "equip"  or "drop").
    option: string;
}

/**
 * Defines an item interaction plugin.
 */
export interface ItemAction extends Action {
    // A single game item ID or a list of item IDs that this action applies to.
    itemIds?: number | number[];
    // A single UI widget ID or a list of widget IDs that this action applies to.
    widgets?: { widgetId: number, containerId: number } | { widgetId: number, containerId: number }[];
    // A single option name or a list of option names that this action applies to.
    options?: string | string[];
    // The action function to be performed.
    action: itemAction;
    // Whether or not this item action should cancel other running or queued actions.
    cancelOtherActions?: boolean;
}

/**
 * A directory of all object interaction plugins.
 */
let itemActions: ItemAction[] = [];

/**
 * Sets the list of object interaction plugins.
 * @param actions The plugin list.
 */
export const setItemActions = (actions: Action[]): void => {
    itemActions = actions as ItemAction[];
};

export const getItemFromContainer = (itemId: number, slot: number, container: ItemContainer): Item => {
    if(slot < 0 || slot > container.items.length - 1) {
        return null;
    }

    const item = container.items[slot];
    if(!item || item.itemId !== itemId) {
        return null;
    }

    return item;
};

// @TODO priority and cancelling other (lower priority) actions
const actionHandler = (player: Player, itemId: number, slot: number, widgetId: number, containerId: number, option: string): void => {
    if(player.busy) {
        return;
    }

    let cancelActions = false;

    // Find all object action plugins that reference this location object
    let interactionActions = itemActions.filter(plugin => {
        if(!questFilter(player, plugin)) {
            return false;
        }

        if(plugin.itemIds !== undefined) {
            if(!basicNumberFilter(plugin.itemIds, itemId)) {
                return false;
            }
        }

        if(plugin.widgets !== undefined) {
            if(Array.isArray(plugin.widgets)) {
                let found = false;
                for(const widget of plugin.widgets) {
                    if(widget.widgetId === widgetId && widget.containerId === containerId) {
                        found = true;
                        break;
                    }
                }

                if(!found) {
                    return false;
                }
            } else {
                if(plugin.widgets.widgetId !== widgetId || plugin.widgets.containerId !== containerId) {
                    return false;
                }
            }
        }

        if(plugin.options !== undefined) {
            if(!basicStringFilter(plugin.options, option)) {
                return false;
            }
        }

        if(plugin.cancelOtherActions) {
            cancelActions = true;
        }
        return true;
    });

    const questActions = interactionActions.filter(plugin => plugin.questRequirement !== undefined);

    if(questActions.length !== 0) {
        interactionActions = questActions;
    }

    if(interactionActions.length === 0) {
        player.outgoingPackets.chatboxMessage(`Unhandled item option: ${option} ${itemId} in slot ${slot} within widget ${widgetId}:${containerId}`);
        return;
    }

    if(cancelActions) {
        player.actionsCancelled.next();
    }

    for(const plugin of interactionActions) {
        plugin.action({
            player,
            itemId,
            itemSlot: slot,
            widgetId,
            containerId,
            itemDetails: world.itemData.get(itemId),
            option
        });
    }

};

World.registerActionEventListener('item_action', actionHandler);
