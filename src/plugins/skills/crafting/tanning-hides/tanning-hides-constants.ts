import { Item } from '@engine/world/items/item';
import { widgets } from '@engine/config';
import { itemIds } from '@engine/world/config/item-ids';

export interface TanableHide {
    hideId: number;
    requiredLevel: number;
    ingredients: Item;
    output: Item & { label: string };
    cost: number;
}

interface TanButton {
    shouldTakeInput: boolean;
    count: number;
    hide: TanableHide;
}

const COWHIDE_LEATHER: TanableHide = {
    hideId: itemIds.hides.cowhide,
    requiredLevel: 1,
    ingredients: { itemId: itemIds.hides.cowhide, amount: 1 },
    output: { label: `Soft leather`, itemId: itemIds.leather.leather, amount: 1 },
    cost: 1,
}

const COWHIDE_HARDLEATHER: TanableHide = {
    hideId: itemIds.hides.cowhide,
    requiredLevel: 28,
    ingredients: { itemId: itemIds.hides.cowhide, amount: 1 },
    output: { label: `Hard leather`, itemId: itemIds.leather.hard_leather, amount: 1 },
    cost: 3,
}

const SNAKEHIDE: TanableHide = {
    hideId: itemIds.hides.snake_hide,
    requiredLevel: 45,
    ingredients: { itemId: itemIds.hides.snake_hide, amount: 1 },
    output: { label: `Snakeskin`, itemId: itemIds.leather.snakeskin, amount: 1 },
    cost: 15,
}

const SNAKEHIDE_TEMPLE_TREKKING: TanableHide = {
    hideId: itemIds.hides.snake_hide_temple_trekking,
    requiredLevel: 45,
    ingredients: { itemId: itemIds.hides.snake_hide_temple_trekking, amount: 1 },
    output: { label: `Snakeskin`, itemId: itemIds.leather.snakeskin, amount: 1 },
    cost: 20,
}

const GREEN_D_HIDE: TanableHide = {
    hideId: itemIds.hides.green_dragonhide,
    requiredLevel: 57,
    ingredients: { itemId: itemIds.hides.green_dragonhide, amount: 1 },
    output: { label: `Green d'hide`, itemId: itemIds.leather.green_d_leather, amount: 1 },
    cost: 20,
}

const BLUE_D_HIDE: TanableHide = {
    hideId: itemIds.hides.blue_dragonhide,
    requiredLevel: 66,
    ingredients: { itemId: itemIds.hides.blue_dragonhide, amount: 1 },
    output: { label: `Blue d'hide`, itemId: itemIds.leather.blue_d_leather, amount: 1 },
    cost: 20,
}

const RED_D_HIDE: TanableHide = {
    hideId: itemIds.hides.red_dragonhide,
    requiredLevel: 73,
    ingredients: { itemId: itemIds.hides.red_dragonhide, amount: 1 },
    output: { label: `Red d'hide`, itemId: itemIds.leather.red_d_leather, amount: 1 },
    cost: 20,
}

const BLACK_D_HIDE: TanableHide = {
    hideId: itemIds.hides.black_dragonhide,
    requiredLevel: 79,
    ingredients: { itemId: itemIds.hides.black_dragonhide, amount: 1 },
    output: { label: `Black d'hide`, itemId: itemIds.leather.black_d_leather, amount: 1 },
    cost: 20,
}

/**
 * Defines the widget model and item slots.
 */
export const widgetModelSlots = [
    { slotId: 100, titleLabel: 108, costLabel: 116, item: COWHIDE_LEATHER },
    { slotId: 101, titleLabel: 109, costLabel: 117, item: COWHIDE_HARDLEATHER },
    { slotId: 102, titleLabel: 110, costLabel: 118, item: SNAKEHIDE },
    { slotId: 103, titleLabel: 111, costLabel: 119, item: SNAKEHIDE_TEMPLE_TREKKING },
    { slotId: 104, titleLabel: 112, costLabel: 120, item: GREEN_D_HIDE },
    { slotId: 105, titleLabel: 113, costLabel: 121, item: BLUE_D_HIDE },
    { slotId: 106, titleLabel: 114, costLabel: 122, item: RED_D_HIDE },
    { slotId: 107, titleLabel: 115, costLabel: 123, item: BLACK_D_HIDE }
];

/**
 * Defines the widget button ids.
 */
export const widgetButtonIds: Map<number, TanButton> = new Map<number, TanButton>([
    [148, { shouldTakeInput: false, count: 1, hide: COWHIDE_LEATHER }],
    [140, { shouldTakeInput: false, count: 5, hide: COWHIDE_LEATHER }],
    [132, { shouldTakeInput: true, count: 0, hide: COWHIDE_LEATHER }],
    [124, { shouldTakeInput: false, count: -1, hide: COWHIDE_LEATHER }],
    [149, { shouldTakeInput: false, count: 1, hide: COWHIDE_HARDLEATHER }],
    [141, { shouldTakeInput: false, count: 5, hide: COWHIDE_HARDLEATHER }],
    [133, { shouldTakeInput: true, count: 0, hide: COWHIDE_HARDLEATHER }],
    [125, { shouldTakeInput: false, count: -1, hide: COWHIDE_HARDLEATHER }],
    [150, { shouldTakeInput: false, count: 1, hide: SNAKEHIDE }],
    [142, { shouldTakeInput: false, count: 5, hide: SNAKEHIDE }],
    [134, { shouldTakeInput: true, count: 0, hide: SNAKEHIDE }],
    [126, { shouldTakeInput: false, count: -1, hide: SNAKEHIDE }],
    [151, { shouldTakeInput: false, count: 1, hide: SNAKEHIDE_TEMPLE_TREKKING }],
    [143, { shouldTakeInput: false, count: 5, hide: SNAKEHIDE_TEMPLE_TREKKING }],
    [135, { shouldTakeInput: true, count: 0, hide: SNAKEHIDE_TEMPLE_TREKKING }],
    [127, { shouldTakeInput: false, count: -1, hide: SNAKEHIDE_TEMPLE_TREKKING }],
    [152, { shouldTakeInput: false, count: 1, hide: GREEN_D_HIDE }],
    [144, { shouldTakeInput: false, count: 5, hide: GREEN_D_HIDE }],
    [136, { shouldTakeInput: true, count: 0, hide: GREEN_D_HIDE }],
    [128, { shouldTakeInput: false, count: -1, hide: GREEN_D_HIDE }],
    [153, { shouldTakeInput: false, count: 1, hide: BLUE_D_HIDE }],
    [145, { shouldTakeInput: false, count: 5, hide: BLUE_D_HIDE }],
    [137, { shouldTakeInput: true, count: 0, hide: BLUE_D_HIDE }],
    [129, { shouldTakeInput: false, count: -1, hide: BLUE_D_HIDE }],
    [154, { shouldTakeInput: false, count: 1, hide: RED_D_HIDE }],
    [146, { shouldTakeInput: false, count: 5, hide: RED_D_HIDE }],
    [138, { shouldTakeInput: true, count: 0, hide: RED_D_HIDE }],
    [130, { shouldTakeInput: false, count: -1, hide: RED_D_HIDE }],
    [155, { shouldTakeInput: false, count: 1, hide: BLACK_D_HIDE }],
    [147, { shouldTakeInput: false, count: 5, hide: BLACK_D_HIDE }],
    [139, { shouldTakeInput: true, count: 0, hide: BLACK_D_HIDE }],
    [131, { shouldTakeInput: false, count: -1, hide: BLACK_D_HIDE }],
]);