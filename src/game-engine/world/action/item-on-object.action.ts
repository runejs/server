import { Player } from '@engine/world/actor/player/player';
import { Position } from '@engine/world/position';
import { ActionHook, getActionHooks } from '@engine/world/action/hooks';
import { Item } from '@engine/world/items/item';
import { advancedNumberHookFilter, questHookFilter } from '@engine/world/action/hooks/hook-filters';
import { ActionPipe, RunnableHooks } from '@engine/world/action/index';
import { LandscapeObject, ObjectConfig } from '@runejs/filestore';
import { playerWalkTo } from '@engine/game-server';


/**
 * Defines an item-on-object action hook.
 */
export interface ItemOnObjectActionHook extends ActionHook<ItemOnObjectAction, itemOnObjectActionHandler> {
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
    object: LandscapeObject;
    // Additional details about the object that the action is being performed on.
    objectConfig: ObjectConfig;
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
 * @param landscapeObject
 * @param objectConfig
 * @param position
 * @param item
 * @param itemWidgetId
 * @param itemContainerId
 * @param cacheOriginal
 */
const itemOnObjectActionPipe = (player: Player, landscapeObject: LandscapeObject,
    objectConfig: ObjectConfig, position: Position,
    item: Item, itemWidgetId: number, itemContainerId: number,
    cacheOriginal: boolean): RunnableHooks<ItemOnObjectAction> => {
    // Find all item on object action plugins that reference this location object
    let matchingHooks = getActionHooks<ItemOnObjectActionHook>('item_on_object')
        .filter(plugin => questHookFilter(player, plugin) &&
            advancedNumberHookFilter(plugin.objectIds, landscapeObject.objectId));
    const questActions = matchingHooks.filter(plugin => plugin.questRequirement !== undefined);

    if(questActions.length !== 0) {
        matchingHooks = questActions;
    }

    // Find all item on object action plugins that reference this item
    if(matchingHooks.length !== 0) {
        matchingHooks = matchingHooks.filter(plugin => advancedNumberHookFilter(plugin.itemIds, item.itemId));
    }

    if(matchingHooks.length === 0) {
        player.outgoingPackets.chatboxMessage(`Unhandled item on object interaction: ${ item.itemId } on ${ objectConfig.name } ` +
            `(id-${ landscapeObject.objectId }) @ ${ position.x },${ position.y },${ position.level }`);
        return null;
    }

    return {
        hooks: matchingHooks,
        actionPosition: position,
        action: {
            player,
            object: landscapeObject,
            objectConfig,
            position,
            item,
            itemWidgetId,
            itemContainerId,
            cacheOriginal
        }
    }
};


/**
 * Item-on-object action pipe definition.
 */
export default [ 'item_on_object', itemOnObjectActionPipe ] as ActionPipe;
