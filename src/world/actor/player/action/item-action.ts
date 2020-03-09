import { Player } from '@server/world/actor/player/player';
import { ActionPlugin, questFilter } from '@server/plugins/plugin';
import { ItemContainer } from '@server/world/items/item-container';
import { Item } from '@server/world/items/item';
import { basicNumberFilter, basicStringFilter } from '@server/plugins/plugin-loader';
import { world } from '@server/game-server';
import { ItemDetails } from '@server/world/config/item-data';

/**
 * The definition for an item action function.
 */
export type itemAction = (details: ItemActionDetails) => void;

/**
 * Details about an item being interacted with.
 */
export interface ItemActionDetails {
    player: Player;
    itemId: number;
    itemSlot: number;
    widgetId: number;
    containerId: number;
    itemDetails: ItemDetails;
    option: string;
}

/**
 * Defines an item interaction plugin.
 */
export interface ItemActionPlugin extends ActionPlugin {
    itemIds?: number | number[];
    widgets?: { widgetId: number, containerId: number } | { widgetId: number, containerId: number }[];
    options?: string | string[];
    action: itemAction;
    cancelOtherActions?: boolean;
}

/**
 * A directory of all object interaction plugins.
 */
let itemInteractions: ItemActionPlugin[] = [];

/**
 * Sets the list of object interaction plugins.
 * @param plugins The plugin list.
 */
export const setItemPlugins = (plugins: ActionPlugin[]): void => {
    itemInteractions = plugins as ItemActionPlugin[];
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
export const itemAction = (player: Player, itemId: number, slot: number, widgetId: number, containerId: number, option: string): void => {
    if(player.busy) {
        return;
    }

    let cancelActions = false;

    // Find all object action plugins that reference this landscape object
    let interactionActions = itemInteractions.filter(plugin => {
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

    const questActions = interactionActions.filter(plugin => plugin.questAction !== undefined);

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
