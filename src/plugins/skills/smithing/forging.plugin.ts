import {
    itemOnObjectActionHandler, ItemOnObjectActionHook, ItemInteractionActionHook
} from '@engine/action';
import { widgets } from '@engine/config/config-handler';
import { Skill } from '@engine/world/actor/skills';
import { anvilIds, bars, smithables, widgetItems } from '@plugins/skills/smithing/forging-constants';
import { itemIds } from '@engine/world/config/item-ids';
import { Smithable } from '@plugins/skills/smithing/forging-types';
import { Player } from '@engine/world/actor/player/player';
import { findItem } from '@engine/config/config-handler';
import { Position } from '@engine/world/position';
import { ForgingTask } from './forging-task';
import { logger } from '@runejs/common';

/**
 * Get the item ids of all the smithable items, as a flat array.
 *
 * @param input A two-dimensional map of smithables, keyed by type and then by item id.
 *              e.g. smithables.get('dagger').get('bronze')
 * @returns A flat array of item ids, e.g. [ bronze_dagger_id, iron_dagger_id, ...]
 * @remarks This is used to check if the player has the correct item in their inventory.
 */
const mapSmithableItemIdsToFlatArray = (input: Map<string, Map<string, Smithable>>) => {
    const result: number[] = [];
    input.forEach((type) => {
        type.forEach((smithable) => {
            result.push(smithable.item.itemId);
        });
    });
    return result;
};

/**
 * Flatten a two-dimensional map of Smithables into an array.
 *
 * TODO (Jameskmonger): this should not be done at runtime! At startup would be one thing,
 *                  but this happens in the `canActivate` method.
 *
 * @param input A two-dimensional map of smithables, keyed by type and then by item id.
 *              e.g. smithables.get('dagger').get('bronze')
 * @returns A flat array of item ids, e.g. [ bronze_dagger_id, iron_dagger_id, ...]
 * @remarks This is used to check if the player has the correct item in their inventory.
 */
const mapSmithablesToFlatArray = (input: Map<string, Map<string, Smithable>>) => {
    const results: Smithable[] = [];
    input.forEach((values) => {
        values.forEach((value) => {
            results.push(value);
        });
    });
    return results;
};

/**
 * Lookup a smithable from just an item id.
 * @param itemId
 */
const findSmithableByItemId = (itemId): Smithable => {
const findSmithableByItemId = (itemId: number) : Smithable | null => {
    return mapSmithablesToFlatArray(smithables).find((smithable) => {
        return smithable.item.itemId === itemId;
    }) || null;
};

/**
 * Check if the player is able to forge an item.
 */
const canForge = (player: Player, smithable: Smithable): boolean => {
    // In case the smithable doesn't exist.
    if (!smithable) {
        return false;
    }

    // Check if the player has the level required.
    if (smithable.level > player.skills.getLevel(Skill.SMITHING)) {
        const item = findItem(smithable.item.itemId);

        if (!item) {
            logger.error(`Could not find smithable item with id ${smithable.item.itemId}`);
            return false;
        }

        player.sendMessage(`You have to be at least level ${smithable.level} to smith ${item.name}s.`, true);
        return false;
    }

    // Check if the player has sufficient materials.
    if (!hasMaterials(player, smithable)) {
        const ingredient = findItem(smithable.ingredient.itemId);

        if (!ingredient) {
            logger.error(`Could not find smithable ingredient with id ${smithable.ingredient.itemId}`);
            return false;
        }

        player.sendMessage(`You don't have enough ${ingredient.name}s.`, true);
        return false;
    }

    player.interfaceState.closeAllSlots();

    return true;
};

/**
 * Checks if the player has enough materials
 * @param player
 * @param smithable
 */
const hasMaterials = (player: Player, smithable: Smithable) => {
    return smithable.ingredient.amount <= player.inventory.findAll(smithable.ingredient.itemId).length;
};

/**
 * Opens the forging interface, and loads the items.
 * @param details
 */
const openForgingInterface: itemOnObjectActionHandler = (details) => {
    const { player, item, object } = details;
    const amountInInventory = player.inventory.findAll(item).length;

    player.face(new Position(object.x, object.y));

    // The player does not have a hammer.
    if (!player.inventory.has(itemIds.hammer)) {
        player.sendMessage(`You need a hammer to work the metal with.`, true);
        return;
    }

    const barLevel = bars.get(item.itemId);

    if (barLevel === undefined) {
        logger.warn(`Could not find bar level for item id ${item.itemId}`);
        return;
    }

    const bar = findItem(item.itemId);

    if (barLevel === undefined || !bar) {
        logger.error(`Could not find bar with id ${item.itemId}`);
        return;
    }

    if (barLevel > player.skills.getLevel(Skill.SMITHING)) {
        player.sendMessage(`You have to be at least level ${barLevel} to smith ${bar.name}s.`, true);
        return;
    }

    player.outgoingPackets.updateClientConfig(210, amountInInventory);
    player.outgoingPackets.updateClientConfig(211, player.skills.getLevel(Skill.SMITHING));

    details.player.interfaceState.openWidget(widgets.anvil.widgetId, {
        slot: 'screen'
    });

    const barWidgetItems = widgetItems.get(item.itemId);

    if (barWidgetItems === undefined) {
        logger.warn(`Could not find bar widget items for item id ${item.itemId}`);
        return;
    }

    barWidgetItems.forEach((items, containerId) => {
        items.forEach((smithable, index) => {
            player.outgoingPackets.sendUpdateSingleWidgetItem({
                widgetId: widgets.anvil.widgetId, containerId: containerId
            }, index, smithable.item);
        });
    });
};

export default {
    pluginId: 'rs:forging',
    hooks: [
        {
            type: 'item_on_object',
            itemIds: [...bars.keys()],
            objectIds: anvilIds,
            walkTo: true,

            cancelOtherActions: true,
            handler: openForgingInterface
        } as ItemOnObjectActionHook,
        {
            type: 'item_interaction',
            itemIds: [...mapSmithableItemIdsToFlatArray(smithables)],
            options: ['make', 'make-5', 'make-10'],
            cancelOtherActions: true,
            handler: ({ player, itemId, option }) => {
                const smithable = findSmithableByItemId(itemId);
                let wantedAmount = 0;

                switch (option) {
                    case 'make': wantedAmount = 1; break;
                    case 'make-5': wantedAmount = 5; break;
                    case 'make-10': wantedAmount = 10; break;
                }

                if (!canForge(player, smithable)) {
                    return;
                }

                player.enqueueTask(ForgingTask, [smithable, wantedAmount]);
            }
        } as ItemInteractionActionHook
    ]
};
