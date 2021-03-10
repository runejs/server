import { widgets } from '@engine/config';
import { itemIds } from '@engine/world/config/item-ids';
import { Bar, Smeltable } from '@plugins/skills/smithing/smelting-types';

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

export const widgetItems = [
    { slot: widgets.furnace.slots.slot1, bar: BLURITE },
    { slot: widgets.furnace.slots.slot2, bar: IRON },
    { slot: widgets.furnace.slots.slot3, bar: SILVER },
    { slot: widgets.furnace.slots.slot4, bar: STEEL },
    { slot: widgets.furnace.slots.slot5, bar: GOLD },
    { slot: widgets.furnace.slots.slot6, bar: MITHRIL },
    { slot: widgets.furnace.slots.slot7, bar: ADAMANTITE },
    { slot: widgets.furnace.slots.slot8, bar: RUNEITE }
];

/**
 * Defines the widget button ids.
 */
export const widgetButtonIds : Map<number, Smeltable> = new Map<number, Smeltable>([
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
