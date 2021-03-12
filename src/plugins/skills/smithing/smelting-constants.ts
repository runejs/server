import { widgets } from '@server/config';
import { itemIds } from '@server/world/config/item-ids';
import { Bar, Smeltable } from '@server/plugins/skills/smithing/smelting-types';

const BRONZE : Bar = {
    barId: itemIds.bars.bronze,
    requiredLevel: 1,
    experience: 6.2,
    ingredients: [
        { itemId: itemIds.ores.copper, amount: 1 },
        { itemId: itemIds.ores.tin, amount: 1 }
    ]
};

const BLURITE : Bar = {
    barId: itemIds.bars.blurite,
    quest: 'theKnightsSword',
    requiredLevel: 8,
    experience: 8,
    ingredients: [
        { itemId: itemIds.ores.blurite, amount: 1 }
    ]
};

const IRON : Bar = {
    barId: itemIds.bars.iron,
    requiredLevel: 15,
    experience: 12.5,
    ingredients: [
        { itemId: itemIds.ores.iron, amount: 1 }
    ]
};

const SILVER : Bar = {
    barId: itemIds.bars.silver,
    requiredLevel: 20,
    experience: 13.6,
    ingredients: [
        { itemId: itemIds.ores.silver, amount: 1 }
    ]
};

const STEEL : Bar = {
    barId: itemIds.bars.steel,
    requiredLevel: 30,
    experience: 17.5,
    ingredients: [
        { itemId: itemIds.ores.iron, amount: 1 },
        { itemId: itemIds.ores.coal, amount: 2 }
    ]
};

const GOLD : Bar = {
    barId: itemIds.bars.gold,
    requiredLevel: 40,
    experience: 22.5,
    ingredients: [
        { itemId: itemIds.ores.gold, amount: 1 }
    ]
};

const MITHRIL : Bar = {
    barId: itemIds.bars.mithril,
    requiredLevel: 50,
    experience: 30,
    ingredients: [
        { itemId: itemIds.ores.mithril, amount: 1 },
        { itemId: itemIds.ores.coal, amount: 4 },
    ]
};

const ADAMANTITE : Bar = {
    barId: itemIds.bars.adamantite,
    requiredLevel: 70,
    experience: 37.5,
    ingredients: [
        { itemId: itemIds.ores.adamantite, amount: 1 },
        { itemId: itemIds.ores.coal, amount: 6 },
    ]
};

const RUNEITE : Bar = {
    barId: itemIds.bars.runite,
    requiredLevel: 85,
    experience: 50,
    ingredients: [
        { itemId: itemIds.ores.runite, amount: 1 },
        { itemId: itemIds.ores.coal, amount: 8 },
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
