/**
 * @Author NickNick
 */

import { Item } from '@server/world/items/item';
import { Position } from '@server/world/position';

export interface RunecraftingRecipe {
    ingredients: Item[] | number[];
}

export interface RunecraftingTiara {
    id: number;
    config: number;
    recipe: RunecraftingRecipe;
    level: number;
    xp: number;
}

export interface RunecraftingTalisman {
    id: number;
}

export interface RunecraftingAltar {
    entranceId: number;
    craftingId: number;
    portalId: number;
    entrance: Position;
    exit: Position;
}

export interface RunecraftingRune {
    id: number;
    xp: number;
    level: number;
    essence: number[];
    altar: RunecraftingAltar;
    tiara: RunecraftingTiara;
    talisman: RunecraftingTalisman;
}
export interface RunecraftingCombinationRune {
    id: number;
    xp: [number, number];
    level: number;
    altar: [RunecraftingAltar, RunecraftingAltar];
    tiara: [RunecraftingTiara, RunecraftingTiara];
    talisman: [RunecraftingTalisman, RunecraftingTalisman];
    runes: [RunecraftingRune, RunecraftingRune];
}
