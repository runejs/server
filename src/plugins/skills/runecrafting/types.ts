import { Item } from '@server/world/items/item';
import { Position } from '@server/world/position';
import { altars, talismans, tiaras } from '@server/plugins/skills/runecrafting/constants';

export interface Recipe {
    ingredients: Item[] | number[];
}

export interface Tiara {
    id: number;
    config: number;
    recipe: Recipe;
    level: number;
    xp: number;
}

export interface Talisman {
    id: number;
}

export interface Altar {
    entranceId: number;
    craftingId: number;
    portalId: number;
    entrance: Position;
    exit: Position;
}

export interface Rune {
    id: number;
    xp: number;
    level: number;
    essence: number[];
    altar: Altar;
    tiara: Tiara;
    talisman: Talisman;
}
export interface CombinationRune {
    id: number;
    xp: [number, number];
    level: number;
    altar: [Altar, Altar];
    tiara: [Tiara, Tiara];
    talisman: [Talisman, Talisman];
    runes: [Rune, Rune];
}
