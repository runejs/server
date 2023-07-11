import { Player } from '@engine/world/actor';
import { WorldItem } from '@engine/world';
import { ItemDetails, findItem } from '@engine/config';
import {
    ActionHook, getActionHooks, numberHookFilter, stringHookFilter, questHookFilter, ActionPipe, RunnableHooks
} from '@engine/action';
import { logger } from '@runejs/common';
import { WalkToItemPluginTask } from './task/walk-to-item-plugin-task';


/**
 * Defines a world item action hook.
 */
export interface SpawnedItemInteractionHook extends ActionHook<SpawnedItemInteractionAction, spawnedItemInteractionHandler> {
    // A single game item ID or a list of item IDs that this action applies to.
    itemIds?: number | number[];
    // A single option name or a list of option names that this action applies to.
    options: string | string[];
    // Whether or not the player needs to walk to this world item before performing the action.
    walkTo: boolean;
}


/**
 * The world item action hook handler function to be called when the hook's conditions are met.
 */
export type spawnedItemInteractionHandler = (spawnedItemInteractionAction: SpawnedItemInteractionAction) => void;


/**
 * Details about a world item action being performed.
 */
export interface SpawnedItemInteractionAction {
    // The player performing the action.
    player: Player;
    // The world item that the player is interacting with.
    worldItem: WorldItem;
    // Details about the item
    itemDetails: ItemDetails;

    // TODO (jkm) add "option" to the action
}


/**
 * The pipe that the game engine hands world item actions off to.
 * @param player
 * @param worldItem
 * @param option
 */
const spawnedItemInteractionPipe = (player: Player, worldItem: WorldItem, option: string): RunnableHooks<SpawnedItemInteractionAction> | null => {
    // Find all world item action plugins that reference this world item
    let matchingHooks = getActionHooks<SpawnedItemInteractionHook>('spawned_item_interaction').filter(plugin => {
        if(!questHookFilter(player, plugin)) {
            return false;
        }

        if(plugin.itemIds !== undefined) {
            if(!numberHookFilter(plugin.itemIds, worldItem.itemId)) {
                return false;
            }
        }

        if(!stringHookFilter(plugin.options, option)) {
            return false;
        }

        return true;
    });

    const questActions = matchingHooks.filter(plugin => plugin.questRequirement !== undefined);

    if(questActions.length !== 0) {
        matchingHooks = questActions;
    }

    if(matchingHooks.length === 0) {
        player.outgoingPackets.chatboxMessage(`Unhandled world item interaction: ${option} ${worldItem.itemId}`);
        return null;
    }

    const itemDetails = findItem(worldItem.itemId);

    if(!itemDetails) {
        logger.error(`Item ${worldItem.itemId} not registered on the server [spawned-item-interaction action pipe]`);
        return null;
    }

    const walkToPlugins = matchingHooks.filter(plugin => plugin.walkTo);

    if (walkToPlugins.length > 0) {
        player.enqueueBaseTask(new WalkToItemPluginTask(walkToPlugins, player, worldItem, itemDetails));

        return null;
    }

    return {
        hooks: matchingHooks,
        actionPosition: worldItem.position,
        action: {
            player,
            worldItem,
            itemDetails
        }
    }
};


/**
 * World item action pipe definition.
 */
export default [ 'spawned_item_interaction', spawnedItemInteractionPipe ] as ActionPipe;
