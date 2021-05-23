import { itemOnObjectActionHandler, ItemOnObjectActionHook } from '@engine/world/action/item-on-object.action';
import { widgets } from '@engine/config';
import { Skill } from '@engine/world/actor/skills';
import { anvilIds, bars, smithables, widgetItems } from '@plugins/skills/smithing/forging-constants';
import { itemIds } from '@engine/world/config/item-ids';
import { Smithable } from '@plugins/skills/smithing/forging-types';
import {
    ItemInteractionAction,
    ItemInteractionActionHook
} from '@engine/world/action/item-interaction.action';
import { Player } from '@engine/world/actor/player/player';
import { findItem } from '@engine/config';
import { TaskExecutor } from '@engine/world/action';
import { Position } from '@engine/world/position';

/**
 * The amount of items the player wants to forge.
 */
let wantedAmount = 0;

/**
 * The amount of items already forged.
 */
let forgedAmount = 0;

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
const findSmithableByItemId = (itemId) : Smithable => {
    return mapToFlatArray(smithables).find((smithable) => {
        return smithable.item.itemId === itemId;
    });
};

/**
 * Check if the player is able to perform the action.
 * @param task
 */
const canActivate = (task: TaskExecutor<ItemInteractionAction>): boolean => {
    const { actor, player, actionData } = task.getDetails();
    const itemId = actionData.itemId;
    const smithable = findSmithableByItemId(itemId);

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
 * The actual forging loop.
 * @param task
 * @param taskIteration
 */
const activate = (task: TaskExecutor<ItemInteractionAction>, taskIteration: number): boolean => {
    const { player, actionData } = task.getDetails();
    const itemId = actionData.itemId;
    const smithable = findSmithableByItemId(itemId);

    // How many? Quick and dirty.
    switch (actionData.option) {
        case 'make'     : wantedAmount = 1; break;
        case 'make-5'   : wantedAmount = 5; break;
        case 'make-10'  : wantedAmount = 10; break;
    }

    for(let m=0; m<wantedAmount; m++) {
        player.playAnimation(898);
        if(taskIteration % 4 === 0) {
            if (!hasMaterials(player, smithable) || wantedAmount === forgedAmount) {
                return false;
            }

            // Remove ingredients
            for (let i=0; i<smithable.ingredient.amount; i++) {
                player.inventory.removeFirst(smithable.ingredient.itemId);
            }

            // Add item to inventory
            player.inventory.add({
                itemId: smithable.item.itemId, amount: smithable.item.amount
            });

            player.outgoingPackets.sendUpdateAllWidgetItems(widgets.inventory, player.inventory);
            player.skills.addExp(Skill.SMITHING, smithable.experience);

            forgedAmount++;
            return true;
        }
    }

    // Reset the properties, and strap in for the next batch.
    if (forgedAmount === wantedAmount) {
        forgedAmount = 0;
        wantedAmount = 0;
        return false;
    }
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
            task: {
                canActivate,
                activate,
                interval: 1
            }
        } as ItemInteractionActionHook
    ]
};
