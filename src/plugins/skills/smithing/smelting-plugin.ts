import { Item } from '@server/world/items/item';
import { ItemContainer } from '@server/world/items/item-container';
import { objectIds } from '@server/world/config/object-ids';
import { objectAction, ObjectActionData } from '@server/world/action/object-action';
import { buttonAction, ButtonActionData } from '@server/world/action/button-action';
import { Skill } from '@server/world/actor/skills';
import { cache } from '@server/game-server';
import { loopingAction } from '@server/world/action';
import { animationIds } from '@server/world/config/animation-ids';
import { soundIds } from '@server/world/config/sound-ids';
import { colors } from '@server/util/colors';
import { widgets } from '@server/config';
import { PlayerQuest } from '@server/config/quest-config';
import { widgetButtonIds, widgetItems } from '@server/plugins/skills/smithing/smelting-constants';
import { Bar } from '@server/plugins/skills/smithing/smelting-types';


export const openSmeltingInterface: objectAction = (details) => {
    details.player.interfaceState.openWidget(widgets.furnace.widgetId, {
        slot: 'chatbox'
    })
    loadSmeltingInterface(details);
};

// We need to tell the widget what the bars actually look like.
const loadSmeltingInterface = (details: ObjectActionData) => {
    const theKnightsSwordQuest : PlayerQuest = details.player.quests.find(quest => quest.questId === 'theKnightsSword');
    // Send the items to the widget.
    widgetItems.forEach((item) => {
        details.player.outgoingPackets.setItemOnWidget(widgets.furnace.widgetId, item.slot.modelId, item.bar.barId, 125);
        if (!details.player.skills.hasLevel(Skill.SMITHING, item.bar.requiredLevel)) {
            details.player.modifyWidget(widgets.furnace.widgetId, { childId: item.slot.titleId, textColor: colors.red });
        } else {
            details.player.modifyWidget(widgets.furnace.widgetId, { childId: item.slot.titleId, textColor: colors.black });
        }
        // Check if the player has completed 'The Knight's Sword' quest, even if the level is okay.
        if (item.bar.quest !== undefined && (theKnightsSwordQuest == undefined || theKnightsSwordQuest.complete)) {
            details.player.modifyWidget(widgets.furnace.widgetId, { childId: item.slot.titleId, textColor: colors.red });
        }
    });
};

/**
 * Check whether the player has the needed ingredients.
 */
const hasIngredients = (details: ButtonActionData, ingredients: Item[], inventory: ItemContainer, loop) => {
    ingredients.forEach((item: Item) => {
        const itemIndex = inventory.findIndex(item);
        if (itemIndex === -1 || inventory.amountInStack(itemIndex) < item.amount) {
            details.player.sendMessage(`You don't have enough ${cache.itemDefinitions.get(item.itemId).name.toLowerCase()}.`, true);
            loop.cancel();
            return;
        }
    });
};

const canSmelt = (details: ButtonActionData, bar: Bar): boolean =>  {
    return details.player.skills.hasLevel(Skill.SMITHING, bar.requiredLevel);
};

const smeltProduct = (details: ButtonActionData, bar: Bar, count: number) => {

    const theKnightsSwordQuest : PlayerQuest = details.player.quests.find(quest => quest.questId === 'theKnightsSword');
    if (bar.quest !== undefined && (theKnightsSwordQuest == undefined || theKnightsSwordQuest.complete)) {
        details.player.sendMessage(`You need to complete The Knight's Sword quest first.`, true);
        return;
    }

    // Check if the player has the required smithing level.
    if (!canSmelt(details, bar)) {
        details.player.sendMessage(`You need a smithing level of ${bar.requiredLevel} to smelt ${cache.itemDefinitions.get(bar.barId).name.toLowerCase()}s.`, true);
        return;
    }

    let elapsedTicks = 0;
    let smelted = 0;
    const loop = loopingAction({ player: details.player });

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

export const buttonClicked : buttonAction = (details) => {

    // Check if player might be spawning widget clientside
    if (!details.player.interfaceState.findWidget(widgets.furnace.widgetId)) {
        return;
    }

    const product = widgetButtonIds.get(details.buttonId);

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

export default [
    {
        type: 'object_action',
        objectIds: [objectIds.furnace, 11666],
        options: ['smelt'],
        walkTo: true,
        action: openSmeltingInterface
    },
    {
        type: 'button',
        widgetId: widgets.furnace.widgetId,
        buttonIds: Array.from(widgetButtonIds.keys()),
        action: buttonClicked
    }
];
