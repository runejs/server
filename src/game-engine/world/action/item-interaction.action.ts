import { Player } from '@engine/world/actor/player/player';
import { ActionHook, getActionHooks } from '@engine/world/action/hooks';
import { ItemDetails } from '@engine/config/item-config';
import { findItem } from '@engine/config';
import { numberHookFilter, stringHookFilter, questHookFilter } from '@engine/world/action/hooks/hook-filters';
import { ActionPipe, RunnableHooks } from '@engine/world/action/index';


/**
 * Defines an item action hook.
 */
export interface ItemInteractionActionHook extends ActionHook<ItemInteractionAction, itemInteractionActionHandler> {
    // A single game item ID or a list of item IDs that this action applies to.
    itemIds?: number | number[];
    // A single UI widget ID or a list of widget IDs that this action applies to.
    widgets?: { widgetId: number, containerId: number } | { widgetId: number, containerId: number }[];
    // A single option name or a list of option names that this action applies to.
    options?: string | string[];
    // Whether or not this item action should cancel other running or queued actions.
    cancelOtherActions?: boolean;
}


/**
 * The item action hook handler function to be called when the hook's conditions are met.
 */
export type itemInteractionActionHandler = (itemInteractionAction: ItemInteractionAction) => void;


/**
 * Details about an item action being performed.
 */
export interface ItemInteractionAction {
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
 * The pipe that the game engine hands item actions off to.
 * @param player
 * @param itemId
 * @param slot
 * @param widgetId
 * @param containerId
 * @param option
 */
const itemInteractionActionPipe = (player: Player, itemId: number, slot: number, widgetId: number,
                                   containerId: number, option: string): RunnableHooks<ItemInteractionAction> => {
    const playerWidget = Object.values(player.interfaceState.widgetSlots).find((widget) => widget && widget.widgetId === widgetId);

    if(playerWidget && playerWidget.fakeWidget != undefined) {
        widgetId = playerWidget.fakeWidget;
    }

    // Find all object action plugins that reference this location object
    let matchingHooks = getActionHooks<ItemInteractionActionHook>('item_interaction', plugin => {
        if(!questHookFilter(player, plugin)) {
            return false;
        }

        if(plugin.itemIds !== undefined) {
            if(!numberHookFilter(plugin.itemIds, itemId)) {
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
            if(!stringHookFilter(plugin.options, option)) {
                return false;
            }
        }
        return true;
    });

    const questActions = matchingHooks.filter(plugin => plugin.questRequirement !== undefined);

    if(questActions.length !== 0) {
        matchingHooks = questActions;
    }

    if(matchingHooks.length === 0) {
        player.outgoingPackets.chatboxMessage(
            `Unhandled item option: ${option} ${itemId} in slot ${slot} within widget ${widgetId}:${containerId}`);
        return null;
    }

    return {
        hooks: matchingHooks,
        action: {
            player,
            itemId,
            itemSlot: slot,
            widgetId,
            containerId,
            itemDetails: findItem(itemId),
            option
        }
    }

};


/**
 * Item action pipe definition.
 */
export default [ 'item_interaction', itemInteractionActionPipe ] as ActionPipe;
