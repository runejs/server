import { Player } from '@server/world/actor/player/player';
import { questFilter } from '@server/plugins/plugin';
import { basicNumberFilter, basicStringFilter } from '@server/plugins/plugin-loader';
import { world } from '@server/game-server';
import { Action, getActionList } from '@server/world/action/index';
import { ItemDetails } from '@server/config/item-config';
import { findItem } from '@server/config';

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

// @TODO priority and cancelling other (lower priority) actions
const itemActionHandler = (player: Player, itemId: number, slot: number, widgetId: number, containerId: number, option: string): void => {
    if(player.busy) {
        return;
    }

    let cancelActions = false;

    // Find all object action plugins that reference this location object
    let interactionActions = getActionList('item_action').filter(plugin => {
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
        player.actionsCancelled.next(null);
    }

    for(const plugin of interactionActions) {
        plugin.action({
            player,
            itemId,
            itemSlot: slot,
            widgetId,
            containerId,
            itemDetails: findItem(itemId),
            option
        });
    }

};

export default {
    action: 'item_action',
    handler: itemActionHandler
};
