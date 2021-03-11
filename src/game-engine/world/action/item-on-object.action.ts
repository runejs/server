import { Player } from '@engine/world/actor/player/player';
import { LocationObject, LocationObjectDefinition } from '@runejs/cache-parser';
import { Position } from '@engine/world/position';
import { ActionHook, ActionPipe, getActionHooks } from '@engine/world/action/hooks';
import { logger } from '@runejs/core';
import { Item } from '@engine/world/items/item';
import { playerWalkTo } from '@engine/game-server';
import { advancedNumberFilter, questHookFilter } from '@engine/world/action/hook-filters';


/**
 * Defines an item-on-object action hook.
 */
export interface ItemOnObjectActionHook extends ActionHook<itemOnObjectActionHandler> {
    // A single game object ID or a list of object IDs that this action applies to.
    objectIds: number | number[];
    // A single game item ID or a list of item IDs that this action applies to.
    itemIds: number | number[];
    // Whether or not the player needs to walk to this object before performing the action.
    walkTo: boolean;
}


/**
 * The item-on-object action hook handler function to be called when the hook's conditions are met.
 */
export type itemOnObjectActionHandler = (itemOnObjectAction: ItemOnObjectAction) => void;


/**
 * Details about an item-on-object action being performed.
 */
export interface ItemOnObjectAction {
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
 * The pipe that the game engine hands item-on-object actions off to.
 * @param player
 * @param locationObject
 * @param locationObjectDefinition
 * @param position
 * @param item
 * @param itemWidgetId
 * @param itemContainerId
 * @param cacheOriginal
 */
const itemOnObjectActionPipe = (player: Player, locationObject: LocationObject,
    locationObjectDefinition: LocationObjectDefinition, position: Position,
    item: Item, itemWidgetId: number, itemContainerId: number,
    cacheOriginal: boolean): void => {
    if(player.busy) {
        return;
    }

    // Find all item on object action plugins that reference this location object
    let interactionActions = getActionHooks<ItemOnObjectActionHook>('item_on_object_action')
        .filter(plugin => questHookFilter(player, plugin) && advancedNumberFilter(plugin.objectIds, locationObject.objectId));
    const questActions = interactionActions.filter(plugin => plugin.questRequirement !== undefined);

    if(questActions.length !== 0) {
        interactionActions = questActions;
    }

    // Find all item on object action plugins that reference this item
    if(interactionActions.length !== 0) {
        interactionActions = interactionActions.filter(plugin => advancedNumberFilter(plugin.itemIds, item.itemId));
    }

    if(interactionActions.length === 0) {
        player.outgoingPackets.chatboxMessage(`Unhandled item on object interaction: ${ item.itemId } on ${ locationObjectDefinition.name } ` +
            `(id-${ locationObject.objectId }) @ ${ position.x },${ position.y },${ position.level }`);
        return;
    }

    player.actionsCancelled.next(null);

    // Separate out walk-to actions from immediate actions
    const walkToPlugins = interactionActions.filter(plugin => plugin.walkTo);
    const immediatePlugins = interactionActions.filter(plugin => !plugin.walkTo);

    // Make sure we walk to the object before running any of the walk-to plugins
    if(walkToPlugins.length !== 0) {
        playerWalkTo(player, position, { interactingObject: locationObject })
            .then(() => {
                player.face(position);

                walkToPlugins.forEach(plugin =>
                    plugin.handler({
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
            plugin.handler({
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


/**
 * Item-on-object action pipe definition.
 */
export default [
    'item_on_object_action',
    itemOnObjectActionPipe
] as ActionPipe;
