import { Player } from '@server/world/actor/player/player';
import { LocationObject, LocationObjectDefinition } from '@runejs/cache-parser';
import { Position } from '@server/world/position';
import { Action, getActionList, walkToAction } from '@server/world/action/index';
import { pluginFilter } from '@server/plugins/plugin-loader';
import { logger } from '@runejs/core';
import { questFilter } from '@server/plugins/plugin';
import { Item } from '@server/world/items/item';

/**
 * The definition for an item on object action function.
 */
export type itemOnObjectAction = (itemOnObjectActionData: ItemOnObjectActionData) => void;

/**
 * Details about an object being interacted with. and the item being used.
 */
export interface ItemOnObjectActionData {
    // The player performing the action.
    player: Player;
    // The object the action is being performed on.
    object: LocationObject;
    // Additional details about the object that the action is being performed on.
    objectDefinition: LocationObjectDefinition;
    // The position that the game object was at when the action was initiated.
    position: Position;
    // The item being used.
    item: Item;
    // The ID of the UI widget that the item being used is in.
    itemWidgetId: number;
    // The ID of the UI container that the item being used is in.
    itemContainerId: number;
    // Whether or not this game object is an original map object or if it has been added/replaced.
    cacheOriginal: boolean;
}

/**
 * Defines an item on object interaction plugin.
 * A list of object ids that apply to the plugin, the options for the object, the items that can be performed on,
 * and whether or not the player must first walk to the object.
 */
export interface ItemOnObjectAction extends Action {
    // A single game object ID or a list of object IDs that this action applies to.
    objectIds: number | number[];
    // A single game item ID or a list of item IDs that this action applies to.
    itemIds: number | number[];
    // Whether or not the player needs to walk to this object before performing the action.
    walkTo: boolean;
    // The action function to be performed.
    action: itemOnObjectAction;
}

// @TODO priority and cancelling other (lower priority) actions
const itemOnObjectActionHandler = (player: Player, locationObject: LocationObject,
    locationObjectDefinition: LocationObjectDefinition, position: Position,
    item: Item, itemWidgetId: number, itemContainerId: number,
    cacheOriginal: boolean): void => {
    if(player.busy) {
        return;
    }

    // Find all item on object action plugins that reference this location object
    let interactionActions = getActionList('item_on_object').filter(plugin => questFilter(player, plugin) && pluginFilter(plugin.objectIds, locationObject.objectId));
    const questActions = interactionActions.filter(plugin => plugin.questRequirement !== undefined);

    if(questActions.length !== 0) {
        interactionActions = questActions;
    }

    // Find all item on object action plugins that reference this item
    if(interactionActions.length !== 0) {
        interactionActions = interactionActions.filter(plugin => pluginFilter(plugin.itemIds, item.itemId));
    }

    if(interactionActions.length === 0) {
        player.outgoingPackets.chatboxMessage(`Unhandled item on object interaction: ${ item.itemId } on ${ locationObjectDefinition.name } ` +
            `(id-${ locationObject.objectId }) @ ${ position.x },${ position.y },${ position.level }`);
        return;
    }

    player.actionsCancelled.next();

    // Separate out walk-to actions from immediate actions
    const walkToPlugins = interactionActions.filter(plugin => plugin.walkTo);
    const immediatePlugins = interactionActions.filter(plugin => !plugin.walkTo);

    // Make sure we walk to the object before running any of the walk-to plugins
    if(walkToPlugins.length !== 0) {
        walkToAction(player, position, { interactingObject: locationObject })
            .then(() => {
                player.face(position);

                walkToPlugins.forEach(plugin =>
                    plugin.action({
                        player,
                        object: locationObject,
                        objectDefinition: locationObjectDefinition,
                        position,
                        item,
                        itemWidgetId,
                        itemContainerId,
                        cacheOriginal
                    }));
            })
            .catch(() => logger.warn(`Unable to complete walk-to action.`));
    }

    // Immediately run any non-walk-to plugins
    if(immediatePlugins.length !== 0) {
        immediatePlugins.forEach(plugin =>
            plugin.action({
                player,
                object: locationObject,
                objectDefinition: locationObjectDefinition,
                position,
                item,
                itemWidgetId,
                itemContainerId,
                cacheOriginal
            }));
    }
};

export default {
    action: 'item_on_object',
    handler: itemOnObjectActionHandler
};
