/**
 * @Author NickNick
 */

import { objectAction, ObjectActionData } from '@engine/world/action/object-action';
import { Skill } from '@engine/world/actor/skills';
import {
    altars, combinationRunes,
    getEntityByAttr,
    getEntityIds, runeMultiplier,
    runes,
} from '@plugins/skills/runecrafting/runecrafting-constants';
import { itemOnObjectAction, ItemOnObjectActionData } from '@engine/world/action/item-on-object-action';
import { RunecraftingCombinationRune } from '@plugins/skills/runecrafting/runecrafting-types';
import { randomBetween } from '@engine/util/num';
import { itemIds } from '@engine/world/config/item-ids';
import { cache } from '@engine/game-server';
import { widgets } from '@engine/config';


const craftRune: objectAction = (details: ObjectActionData) => {
    const { player, object } = details;
    const rune = getEntityByAttr(runes, 'altar.craftingId', object.objectId);
    const runeDetails = cache.itemDefinitions.get(rune.id);

    const level = player.skills.get(Skill.RUNECRAFTING).level;
    if (level < rune.level) {
        player.sendMessage(`You need a runecrafting level of ${rune.level} to craft ${runeDetails.name}.`);
        return;
    }
    let essenceAvailable = 0;
    rune.essence.forEach((essenceId) => {
        essenceAvailable += player.inventory.findAll(essenceId).length;
    });

    if (essenceAvailable > 0) {
        // Remove essence from inventory.
        rune.essence.forEach((essenceId) => {
            player.inventory.findAll(essenceId).forEach((index) => {
                player.inventory.remove(index);
            });
        });
        // Add crafted runes to inventory.
        player.inventory.add({ itemId: rune.id, amount: (runeMultiplier(rune.id, level) * essenceAvailable) });
        // Add experience
        player.skills.addExp(Skill.RUNECRAFTING, (rune.xp * essenceAvailable));
        // Update widget items.
        player.outgoingPackets.sendUpdateAllWidgetItems(widgets.inventory, player.inventory);
        return;
    }

    player.sendMessage(`You do not have any rune essence to bind.`);
};

function getCombinationRuneByAltar(itemId: number, objectId: number): RunecraftingCombinationRune | undefined {
    let rune = undefined;
    for (const combinationRune of combinationRunes.values()) {
        const altarIndex = combinationRune.altar.findIndex((altar) => altar.craftingId === objectId);
        if (altarIndex > -1 && combinationRune.talisman[altarIndex ^ 1].id === itemId) {
            rune = combinationRune;
            break;
        }
    }
    return rune;
}

const craftCombinationRune: itemOnObjectAction = (details: ItemOnObjectActionData) => {
    const { player, object, item } = details;
    const rune = getCombinationRuneByAltar(item.itemId, object.objectId);
    if (!rune) {
        player.sendMessage('Nothing interesting happens.');
        return;
    }

    const altarIndex = rune.altar.findIndex(altar => object.objectId === altar.craftingId);
    const shouldBreakTalisman = randomBetween(0, 1) === 1;
    const requiredRunesIndex = player.inventory.findIndex(rune.runes[altarIndex ^ 1].id);
    if (requiredRunesIndex < 0) {
        player.sendMessage(`You don't have any runes to bind.`);
        return;
    }
    const runeDetails = cache.itemDefinitions.get(rune.id);

    const level = player.skills.get(Skill.RUNECRAFTING).level;
    if (level < rune.level) {
        player.sendMessage(`You need a runecrafting level of ${rune.level} to craft ${runeDetails.name}.`);
        return;
    }

    const essenceAvailable = player.inventory.findAll(itemIds.essence.pure).length;
    const requiredRunesAvailable = player.inventory.amountInStack(requiredRunesIndex);
    if (essenceAvailable > 0 && requiredRunesIndex > 0) {
        const amountToCraft = Math.min(essenceAvailable, requiredRunesAvailable);

        // Remove runes from inventory
        if (amountToCraft === requiredRunesAvailable) {
            player.inventory.remove(requiredRunesIndex, false);
        } else {
            player.inventory.set(requiredRunesIndex, {
                itemId: rune.runes[altarIndex ^ 1].id,
                amount: requiredRunesAvailable - amountToCraft
            });
        }
        // Remove essence from inventory.
        for (let i = 0; i < amountToCraft; i++) {
            player.inventory.removeFirst(itemIds.essence.pure);
        }
        // Add crafted runes to inventory.
        player.inventory.add({ itemId: rune.id, amount: amountToCraft });
        // Add experience
        player.skills.addExp(Skill.RUNECRAFTING, (rune.xp[altarIndex] * essenceAvailable));
        if (shouldBreakTalisman) {
            player.inventory.removeFirst(item.itemId);
        }
        // Update widget items.
        player.outgoingPackets.sendUpdateAllWidgetItems(widgets.inventory, player.inventory);
        player.sendMessage(`You craft some ${runeDetails.name}.`);
        return;
    }
    //
    player.sendMessage(`You do not have any pure essence to bind.`);
};


export default [
    {
        type: 'object_action',
        objectIds: getEntityIds(altars, 'craftingId'),
        walkTo: true,
        action: craftRune
    },
    {
        type: 'item_on_object',
        objectIds: getEntityIds(altars, 'craftingId'),
        walkTo: true,
        action: craftCombinationRune
    }
];
