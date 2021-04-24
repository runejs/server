import { Player } from '@engine/world/actor/player/player';
import { ActionHook, getActionHooks } from '@engine/world/action/hooks';
import { logger } from '@runejs/core';
import { WorldItem } from '@engine/world/items/world-item';
import { ItemDetails } from '@engine/config/item-config';
import { findItem } from '@engine/config';
import { playerWalkTo } from '@engine/game-server';
import { numberHookFilter, stringHookFilter, questHookFilter } from '@engine/world/action/hooks/hook-filters';
import { ActionPipe, RunnableHooks } from '@engine/world/action/index';


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
}


/**
 * The pipe that the game engine hands world item actions off to.
 * @param player
 * @param worldItem
 * @param option
 */
const spawnedItemInteractionPipe = (player: Player, worldItem: WorldItem, option: string): RunnableHooks<SpawnedItemInteractionAction> => {
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
