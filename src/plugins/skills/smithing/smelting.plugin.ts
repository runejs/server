import { Item } from '@engine/world/items/item';
import { ItemContainer } from '@engine/world/items/item-container';
import { objectIds } from '@engine/world/config/object-ids';
import { objectInteractionActionHandler, ObjectInteractionAction } from '@engine/action';
import { buttonActionHandler, ButtonAction } from '@engine/action';
import { Skill } from '@engine/world/actor/skills';
import { animationIds } from '@engine/world/config/animation-ids';
import { soundIds } from '@engine/world/config/sound-ids';
import { colors } from '@engine/util/colors';
import { findItem, widgets } from '@engine/config/config-handler';
import { widgetButtonIds, widgetItems } from '@plugins/skills/smithing/smelting-constants';
import { Bar } from '@plugins/skills/smithing/smelting-types';
import { loopingEvent } from '@engine/plugins';
import { logger } from '@runejs/common';


export const openSmeltingInterface: objectInteractionActionHandler = (details) => {
    details.player.interfaceState.openWidget(widgets.furnace.widgetId, {
        slot: 'chatbox'
    })
    loadSmeltingInterface(details);
};

// We need to tell the widget what the bars actually look like.
const loadSmeltingInterface = (details: ObjectInteractionAction) => {
    const theKnightsSwordQuest = details.player.quests.find(quest => quest.questId === 'theKnightsSword');
    // Send the items to the widget.
    widgetItems.forEach((item) => {
        details.player.outgoingPackets.setItemOnWidget(widgets.furnace.widgetId, item.slot.modelId, item.bar.barId, 125);
        if (!details.player.skills.hasLevel(Skill.SMITHING, item.bar.requiredLevel)) {
            details.player.modifyWidget(widgets.furnace.widgetId, { childId: item.slot.titleId, textColor: colors.red });
        } else {
            details.player.modifyWidget(widgets.furnace.widgetId, { childId: item.slot.titleId, textColor: colors.black });
        }


        // TODO (Jameskmonger) I don't think that this logic is correct.. it targets all items, not just those related to the quest.
        // Check if the player has completed 'The Knight's Sword' quest, even if the level is okay.
        if (item.bar.quest !== undefined && (theKnightsSwordQuest == undefined || theKnightsSwordQuest.complete)) {
            details.player.modifyWidget(widgets.furnace.widgetId, { childId: item.slot.titleId, textColor: colors.red });
        }
    });
};

/**
 * Check whether the player has the needed ingredients.
 */
const hasIngredients = (details: ButtonAction, ingredients: Item[], inventory: ItemContainer, loop) => {
    ingredients.forEach((item: Item) => {
        const itemIndex = inventory.findIndex(item);
        if (itemIndex === -1 || inventory.amountInStack(itemIndex) < item.amount) {
            const itemName = findItem(item.itemId)?.name || '';

            details.player.sendMessage(`You don't have enough ${itemName.toLowerCase()}.`, true);
            loop.cancel();
            return;
        }
    });
};

const canSmelt = (details: ButtonAction, bar: Bar): boolean =>  {
    return details.player.skills.hasLevel(Skill.SMITHING, bar.requiredLevel);
};

const smeltProduct = (details: ButtonAction, bar: Bar, count: number) => {

    // TODO (Jameskmonger) I don't think that this logic is correct.. it targets all items, not just those related to the quest.
    const theKnightsSwordQuest = details.player.quests.find(quest => quest.questId === 'theKnightsSword');
    if (bar.quest !== undefined && (theKnightsSwordQuest == undefined || theKnightsSwordQuest.complete)) {
        details.player.sendMessage(`You need to complete The Knight's Sword quest first.`, true);
        return;
    }

    // Check if the player has the required smithing level.
    if (!canSmelt(details, bar)) {
        const barName = findItem(bar.barId)?.name || '';
        details.player.sendMessage(`You need a smithing level of ${bar.requiredLevel} to smelt ${barName.toLowerCase()}s.`, true);
        return;
    }

    let elapsedTicks = 0;
    let smelted = 0;
    const loop = loopingEvent({ player: details.player });

    // Check if the player is missing some or all ingredients.
    hasIngredients(details, bar.ingredients, details.player.inventory, loop);

    // Start the loop for smelting ores into bars.
    loop.event.subscribe(() => {
        if (smelted === count) {
            loop.cancel();
            return;
        }

        // Check if the player still has the ingredients needed.
        hasIngredients(details, bar.ingredients, details.player.inventory, loop);

        // Smelting takes 3 ticks for each item
        if (elapsedTicks % 3 === 0) {
            bar.ingredients.forEach((item) => {
                for (let i = 0; i < item.amount; i++) {
                    details.player.removeFirstItem(item.itemId);
                }
            });
            details.player.giveItem(bar.barId);
            details.player.skills.addExp(Skill.SMITHING, bar.experience);
            smelted++;

            details.player.playAnimation(animationIds.smelting);
            details.player.outgoingPackets.playSound(soundIds.smelting, 5);
        }

        elapsedTicks++;
    });
};

export const buttonClicked : buttonActionHandler = (details) => {

    // Check if player might be spawning widget clientside
    if (!details.player.interfaceState.findWidget(widgets.furnace.widgetId)) {
        return;
    }

    const product = widgetButtonIds.get(details.buttonId);

    if (!product) {
        logger.warn(`No smeltable product found for buttonId ${details.buttonId}.`);
        return;
    }

    details.player.interfaceState.closeAllSlots();

    if (!product.takesInput) {
        smeltProduct(details, product.bar, product.count);
    } else {
        const numericInputSpinSubscription = details.player.numericInputEvent.subscribe((number) => {
            actionCancelledSpinSubscription?.unsubscribe();
            numericInputSpinSubscription?.unsubscribe();
            smeltProduct(details, product.bar, number);
        });

        const actionCancelledSpinSubscription = details.player.actionsCancelled.subscribe(() => {
            actionCancelledSpinSubscription?.unsubscribe();
            numericInputSpinSubscription?.unsubscribe();
        });

        details.player.outgoingPackets.showNumberInputDialogue();
    }
};

export default {
    pluginId: 'rs:smelting',
    hooks: [
        {
            type: 'object_interaction',
            objectIds: [ objectIds.furnace, 11666 ],
            options: [ 'smelt' ],
            walkTo: true,
            handler: openSmeltingInterface
        },
        {
            type: 'button',
            widgetId: widgets.furnace.widgetId,
            buttonIds: Array.from(widgetButtonIds.keys()),
            handler: buttonClicked
        }
    ]
};
