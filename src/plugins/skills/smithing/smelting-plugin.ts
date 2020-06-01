import { Item } from '@server/world/items/item';
import { ItemContainer } from '@server/world/items/item-container';
import { ActionType, RunePlugin } from '@server/plugins/plugin';
import { objectIds } from '@server/world/config/object-ids';
import { objectAction, ObjectActionDetails } from '@server/world/actor/player/action/object-action';
import { widgets } from '@server/world/config/widget';
import { buttonAction, ButtonActionDetails } from '@server/world/actor/player/action/button-action';
import { itemIds } from '@server/world/config/item-ids';
import { Subscription } from 'rxjs';
import { Skill } from '@server/world/actor/skills';
import { cache } from '@server/game-server';
import { loopingAction } from '@server/world/actor/player/action/action';
import { animationIds } from '@server/world/config/animation-ids';
import { soundIds } from '@server/world/config/sound-ids';
import { colors } from '@server/util/colors';

export interface Bar {
    barId: number;
    quest?: string;
    requiredLevel: number;
    ingredients: Item[];
    experience: number;
}

const BRONZE : Bar = {
    barId: itemIds.bronzeBar,
    requiredLevel: 1,
    experience: 6.2,
    ingredients: [
        { itemId: itemIds.copperOre, amount: 1 },
        { itemId: itemIds.tinOre, amount: 1 }
    ]
};

const BLURITE : Bar = {
    barId: itemIds.bluriteBar,
    quest: 'theKnightsSword',
    requiredLevel: 8,
    experience: 8,
    ingredients: [
        { itemId: itemIds.bluriteOre, amount: 1 }
    ]
};

const IRON : Bar = {
    barId: itemIds.ironBar,
    requiredLevel: 15,
    experience: 12.5,
    ingredients: [
        { itemId: itemIds.ironOre, amount: 1 }
    ]
};

const SILVER : Bar = {
    barId: itemIds.silverBar,
    requiredLevel: 20,
    experience: 13.6,
    ingredients: [
        { itemId: itemIds.silverOre, amount: 1 }
    ]
};

const STEEL : Bar = {
    barId: itemIds.steelBar,
    requiredLevel: 30,
    experience: 17.5,
    ingredients: [
        { itemId: itemIds.ironOre, amount: 1 },
        { itemId: itemIds.coal, amount: 2 }
    ]
};

const GOLD : Bar = {
    barId: itemIds.goldBar,
    requiredLevel: 40,
    experience: 22.5,
    ingredients: [
        { itemId: itemIds.goldOre, amount: 1 }
    ]
};

const MITHRIL : Bar = {
    barId: itemIds.mithrilBar,
    requiredLevel: 50,
    experience: 30,
    ingredients: [
        { itemId: itemIds.mithrilOre, amount: 1 },
        { itemId: itemIds.coal, amount: 4 },
    ]
};

const ADAMANTITE : Bar = {
    barId: itemIds.adamantiteBar,
    requiredLevel: 70,
    experience: 37.5,
    ingredients: [
        { itemId: itemIds.adamantiteOre, amount: 1 },
        { itemId: itemIds.coal, amount: 6 },
    ]
};

const RUNEITE : Bar = {
    barId: itemIds.runiteBar,
    requiredLevel: 85,
    experience: 50,
    ingredients: [
        { itemId: itemIds.runiteOre, amount: 1 },
        { itemId: itemIds.coal, amount: 8 },
    ]
};

export const openSmeltingInterface: objectAction = (details) => {
    details.player.activeWidget = {
        widgetId: widgets.furnace.widgetId,
        type: 'CHAT',
        closeOnWalk: true
    };
    loadSmeltingInterface(details);
};

const widgetItems = [
    { slot: widgets.furnace.slots.slot1, bar: BLURITE },
    { slot: widgets.furnace.slots.slot2, bar: IRON },
    { slot: widgets.furnace.slots.slot3, bar: SILVER },
    { slot: widgets.furnace.slots.slot4, bar: STEEL },
    { slot: widgets.furnace.slots.slot5, bar: GOLD },
    { slot: widgets.furnace.slots.slot6, bar: MITHRIL },
    { slot: widgets.furnace.slots.slot7, bar: ADAMANTITE },
    { slot: widgets.furnace.slots.slot8, bar: RUNEITE }
];

interface Smeltable {
    takesInput: boolean;
    count: number;
    bar: Bar;
}

const widgetButtonIds : Map<number, Smeltable> = new Map<number, Smeltable>([
    [16, { takesInput: false, count: 1,  bar: BRONZE }],
    [15, { takesInput: false, count: 5,  bar: BRONZE }],
    [14, { takesInput: false, count: 10, bar: BRONZE }],
    [13, { takesInput: true,  count: 0,  bar: BRONZE }],
    [20, { takesInput: false, count: 1,  bar: BLURITE }],
    [19, { takesInput: false, count: 5,  bar: BLURITE }],
    [18, { takesInput: false, count: 10, bar: BLURITE }],
    [17, { takesInput: true,  count: 0,  bar: BLURITE }],
    [24, { takesInput: false, count: 1,  bar: IRON }],
    [23, { takesInput: false, count: 5,  bar: IRON }],
    [22, { takesInput: false, count: 10, bar: IRON }],
    [21, { takesInput: true,  count: 0,  bar: IRON }],
    [28, { takesInput: false, count: 1,  bar: SILVER }],
    [27, { takesInput: false, count: 5,  bar: SILVER }],
    [26, { takesInput: false, count: 10, bar: SILVER }],
    [25, { takesInput: true,  count: 0,  bar: SILVER }],
    [32, { takesInput: false, count: 1,  bar: STEEL }],
    [31, { takesInput: false, count: 5,  bar: STEEL }],
    [30, { takesInput: false, count: 10, bar: STEEL }],
    [29, { takesInput: true,  count: 0,  bar: STEEL }],
    [36, { takesInput: false, count: 1,  bar: GOLD }],
    [35, { takesInput: false, count: 5,  bar: GOLD }],
    [34, { takesInput: false, count: 10, bar: GOLD }],
    [33, { takesInput: true,  count: 0,  bar: GOLD }],
    [40, { takesInput: false, count: 1,  bar: MITHRIL }],
    [39, { takesInput: false, count: 5,  bar: MITHRIL }],
    [38, { takesInput: false, count: 10, bar: MITHRIL }],
    [37, { takesInput: true,  count: 0,  bar: MITHRIL }],
    [44, { takesInput: false, count: 1,  bar: ADAMANTITE }],
    [43, { takesInput: false, count: 5,  bar: ADAMANTITE }],
    [42, { takesInput: false, count: 10, bar: ADAMANTITE }],
    [41, { takesInput: true,  count: 0,  bar: ADAMANTITE }],
    [48, { takesInput: false, count: 1,  bar: RUNEITE }],
    [47, { takesInput: false, count: 5,  bar: RUNEITE }],
    [46, { takesInput: false, count: 10, bar: RUNEITE }],
    [45, { takesInput: true,  count: 0,  bar: RUNEITE }]
]);

// We need to tell the widget what the bars actually look like.
const loadSmeltingInterface = (details: ObjectActionDetails) => {
    const theKnightsSwordQuest = details.player.quests.find(quest => quest.questId === 'theKnightsSword');
    // Send the items to the widget.
    widgetItems.forEach((item) => {
        details.player.outgoingPackets.setItemOnWidget(widgets.furnace.widgetId, item.slot.modelId, item.bar.barId, 125);
        if (!details.player.skills.hasSkillLevel(Skill.SMITHING, item.bar.requiredLevel)) {
            details.player.modifyWidget(widgets.furnace.widgetId, { childId: item.slot.titleId, textColor: colors.red});
        } else {
            details.player.modifyWidget(widgets.furnace.widgetId, { childId: item.slot.titleId, textColor: colors.black});
        }
        // Check if the player has completed 'The Knight's Sword' quest, even if the level is okay.
        if (item.bar.quest !== undefined && (theKnightsSwordQuest == undefined || theKnightsSwordQuest.stage !== 'COMPLETE')) {
            details.player.modifyWidget(widgets.furnace.widgetId, { childId: item.slot.titleId, textColor: colors.red});
        }
    });
};

const hasIngredients = (details: ButtonActionDetails, ingredients: Item[], inventory: ItemContainer, loop) => {
    ingredients.forEach((item: Item) => {
        const itemIndex = inventory.findIndex(item);
        if (itemIndex === -1 || inventory.amountInStack(itemIndex) < item.amount) {
            details.player.sendMessage(`You don't have enough ${cache.itemDefinitions.get(item.itemId).name.toLowerCase()}.`, true);
            loop.cancel();
            return;
        }
    });
};

const canSmelt = (details: ButtonActionDetails, bar: Bar): boolean =>  {
    return details.player.skills.hasSkillLevel(Skill.SMITHING, bar.requiredLevel);
};

const smeltProduct = (details: ButtonActionDetails, bar: Bar, count: number) => {

    const theKnightsSwordQuest = details.player.quests.find(quest => quest.questId === 'theKnightsSword');
    if (bar.quest !== undefined && (theKnightsSwordQuest == undefined || theKnightsSwordQuest.stage !== 'COMPLETE')) {
        details.player.sendMessage(`You need to complete The Knight\´s Sword quest first.`, true);
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
    if (!details.player.activeWidget || !(details.player.activeWidget.widgetId === widgets.furnace.widgetId)) {
        return;
    }

    const product = widgetButtonIds.get(details.buttonId);

    details.player.closeActiveWidgets();

    if (!product.takesInput) {
        smeltProduct(details, product.bar, product.count);
    } else {
        let numericInputSpinSubscription: Subscription;
        let actionCancelledSpinSubscription: Subscription;

        numericInputSpinSubscription = details.player.numericInputEvent.subscribe((number) => {
            actionCancelledSpinSubscription.unsubscribe();
            numericInputSpinSubscription.unsubscribe();
            smeltProduct(details, product.bar, number);
        });

        actionCancelledSpinSubscription = details.player.actionsCancelled.subscribe(() => {
            actionCancelledSpinSubscription.unsubscribe();
            numericInputSpinSubscription.unsubscribe();
        });

        details.player.outgoingPackets.showNumberInputDialogue();
    }
};

export default new RunePlugin([
    {
        type: ActionType.OBJECT_ACTION,
        objectIds: [objectIds.furnace],
        options: ['smelt'],
        walkTo: true,
        action: openSmeltingInterface
    },
    {
        type: ActionType.BUTTON,
        widgetId: widgets.furnace.widgetId,
        buttonIds: Array.from(widgetButtonIds.keys()),
        action: buttonClicked
    }
]);