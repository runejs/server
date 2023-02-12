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

const mapWidgetItemsToFlatArray = (input) => {
    const result = [];
    smithables.forEach((type) => {
        type.forEach((smithable) => {
            result.push(smithable.item.itemId);
        });
    });
    return result;
};

const mapToFlatArray = (input) => {
    const results = [];
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
    return mapToFlatArray(smithables).find((smithable) => {
        return smithable.item.itemId === itemId;
    });
};

/**
 * Check if the player is able to perform the action.
 * @param task
 */
const canForge = (player: Player, smithable: Smithable): boolean => {
    // In case the smithable doesn't exist.
    if (!smithable) {
        return false;
    }

    // Check if the player has the level required.
    if (smithable.level > player.skills.getLevel(Skill.SMITHING)) {
        const item = findItem(smithable.item.itemId);
        player.sendMessage(`You have to be at least level ${smithable.level} to smith ${item.name}s.`, true);
        return false;
    }

    // Check if the player has sufficient materials.
    if (!hasMaterials(player, smithable)) {
        const bar = findItem(smithable.ingredient.itemId);
        player.sendMessage(`You don't have enough ${bar.name}s.`, true);
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
    const bar = findItem(item.itemId);
    if (barLevel > player.skills.getLevel(Skill.SMITHING)) {
        player.sendMessage(`You have to be at least level ${barLevel} to smith ${bar.name}s.`, true);
        return;
    }

    player.outgoingPackets.updateClientConfig(210, amountInInventory);
    player.outgoingPackets.updateClientConfig(211, player.skills.getLevel(Skill.SMITHING));

    details.player.interfaceState.openWidget(widgets.anvil.widgetId, {
        slot: 'screen'
    });

    widgetItems.get(item.itemId).forEach((items, containerId) => {
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
            itemIds: [...mapWidgetItemsToFlatArray(smithables)],
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
