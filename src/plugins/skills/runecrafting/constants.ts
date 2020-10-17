/*
    RUNECRAFTING Tiara Configs
    Air - config 491 1
    Mind - config 491 2
    Water - config 491 4
    Earth - config 491 8
    Fire - config 491 16
    Body - config 491 32
    Cosmic - config 491 64
    Chaos - config 491 128
    Nature - config 491 256
    Law - config 491 512
    Death - config 491 1024
 */

import { itemIds } from '@server/world/config/item-ids';
import { Altar, Rune, Talisman, Tiara } from '@server/plugins/skills/runecrafting/types';
import { Position } from '@server/world/position';

export const tiaras: Map<string, Tiara> = new Map<string, Tiara>([
    ['air', {
        id: itemIds.tiaras.air,
        config: 1,
        level: 1,
        xp: 25.0,
        recipe: {ingredients: [itemIds.talismans.air, itemIds.tiaras.blank]}
    }],
    ['mind', {
        id: itemIds.tiaras.mind,
        config: 2,
        level: 1,
        xp: 27.5,
        recipe: {ingredients: [itemIds.talismans.mind, itemIds.tiaras.blank]}
    }],
    ['water', {
        id: itemIds.tiaras.water,
        config: 4,
        level: 1,
        xp: 30,
        recipe: {ingredients: [itemIds.talismans.water, itemIds.tiaras.blank]}
    }],
    ['body', {
        id: itemIds.tiaras.body,
        config: 32,
        level: 1,
        xp: 37.5,
        recipe: {ingredients: [itemIds.talismans.body, itemIds.tiaras.blank]}
    }],
    ['earth', {
        id: itemIds.tiaras.earth,
        config: 8,
        level: 1,
        xp: 32.5,
        recipe: {ingredients: [itemIds.talismans.earth, itemIds.tiaras.blank]}
    }],
    ['fire', {
        id: itemIds.tiaras.fire,
        config: 16,
        level: 1,
        xp: 35,
        recipe: {ingredients: [itemIds.talismans.fire, itemIds.tiaras.blank]}
    }],
    ['cosmic', {
        id: itemIds.tiaras.cosmic,
        config: 64,
        level: 1,
        xp: 40,
        recipe: {ingredients: [itemIds.talismans.cosmic, itemIds.tiaras.blank]}
    }],
    ['nature', {
        id: itemIds.tiaras.nature,
        config: 256,
        level: 1,
        xp: 45,
        recipe: {ingredients: [itemIds.talismans.nature, itemIds.tiaras.blank]}
    }],
    ['chaos', {
        id: itemIds.tiaras.chaos,
        config: 128,
        level: 1,
        xp: 42.5,
        recipe: {ingredients: [itemIds.talismans.chaos, itemIds.tiaras.blank]}
    }],
    ['law', {
        id: itemIds.tiaras.law,
        config: 512,
        level: 1,
        xp: 47.5,
        recipe: {ingredients: [itemIds.talismans.law, itemIds.tiaras.blank]}
    }],
    ['death', {
        id: itemIds.tiaras.death,
        config: 1024,
        level: 1,
        xp: 50,
        recipe: {ingredients: [itemIds.talismans.death, itemIds.tiaras.blank]}
    }],
]);

export const talismans: Map<string, Talisman> = new Map<string, Talisman>([
    ['air', {id: itemIds.talismans.air}],
    ['mind', {id: itemIds.talismans.mind}],
    ['water', {id: itemIds.talismans.water}],
    ['body', {id: itemIds.talismans.body}],
    ['earth', {id: itemIds.talismans.earth}],
    ['fire', {id: itemIds.talismans.fire}],
    ['cosmic', {id: itemIds.talismans.cosmic}],
    ['nature', {id: itemIds.talismans.nature}],
    ['chaos', {id: itemIds.talismans.chaos}],
    ['law', {id: itemIds.talismans.law}],
    ['death', {id: itemIds.talismans.death}],
    ['elemental', {id: itemIds.talismans.elemental}],
]);

export const altars: Map<string, Altar> = new Map<string, Altar>([
    ['air', {
        entranceId: 2452,
        craftingId: 2478,
        portalId: 2465,
        entrance: new Position(2841, 4829, 0),
        exit: new Position(2983, 3292, 0)
    }],
    ['mind', {
        entranceId: 2453,
        craftingId: 2479,
        portalId: 2466,
        entrance: new Position(2793, 4828, 0),
        exit: new Position(2980, 3514, 0)
    }],
    ['water', {
        entranceId: 2454,
        craftingId: 2480,
        portalId: 2467,
        entrance: new Position(2726, 4832, 0),
        exit: new Position(3187, 3166, 0)
    }],
    ['earth', {
        entranceId: 2455,
        craftingId: 2481,
        portalId: 2468,
        entrance: new Position(2655, 4830, 0),
        exit: new Position(3304, 3474, 0)
    }],
    ['fire', {
        entranceId: 2456,
        craftingId: 2482,
        portalId: 2469,
        entrance: new Position(2574, 4849, 0),
        exit: new Position(3311, 3256, 0)
    }],
    ['body', {
        entranceId: 2457,
        craftingId: 2483,
        portalId: 2470,
        entrance: new Position(2524, 4825, 0),
        exit: new Position(3051, 3445, 0)
    }],
    ['cosmic', {
        entranceId: 2458,
        craftingId: 2484,
        portalId: 2471,
        entrance: new Position(2142, 4813, 0),
        exit: new Position(2408, 4379, 0)
    }],
    ['law', {
        entranceId: 2459,
        craftingId: 2485,
        portalId: 2472,
        entrance: new Position(2464, 4818, 0),
        exit: new Position(2858, 3379, 0)
    }],
    ['nature', {
        entranceId: 2460,
        craftingId: 2486,
        portalId: 2473,
        entrance: new Position(2400, 4835, 0),
        exit: new Position(2867, 3019, 0)
    }],
    ['chaos', {
        entranceId: 2461,
        craftingId: 2487,
        portalId: 2474,
        entrance: new Position(2268, 4842, 0),
        exit: new Position(3058, 3591, 0)
    }],
    ['death', {
        entranceId: 2462,
        craftingId: 2488,
        portalId: 2475,
        entrance: new Position(2208, 4830, 0),
        exit: new Position(3222, 3222, 0)
    }],
]);

export const runes: Map<string, Rune> = new Map<string, Rune>([
    ['air', {
        id: 556,
        xp: 5.0,
        level: 1,
        essence: [itemIds.essence.pure, itemIds.essence.rune],
        altar: altars.get('air'),
        talisman: talismans.get('air'),
        tiara: tiaras.get('air')
    }],
    ['mind', {
        id: 558,
        xp: 5.5,
        level: 1,
        essence: [itemIds.essence.pure, itemIds.essence.rune],
        altar: altars.get('mind'),
        talisman: talismans.get('mind'),
        tiara: tiaras.get('mind')
    }],
    ['water', {
        id: 555,
        xp: 6,
        level: 5,
        essence: [itemIds.essence.pure, itemIds.essence.rune],
        altar: altars.get('water'),
        talisman: talismans.get('water'),
        tiara: tiaras.get('water')
    }],
    ['earth', {
        id: 557,
        xp: 6.5,
        level: 9,
        essence: [itemIds.essence.pure, itemIds.essence.rune],
        altar: altars.get('earth'),
        talisman: talismans.get('earth'),
        tiara: tiaras.get('earth')
    }],
    ['fire', {
        id: 554,
        xp: 7.0,
        level: 14,
        essence: [itemIds.essence.pure, itemIds.essence.rune],
        altar: altars.get('fire'),
        talisman: talismans.get('fire'),
        tiara: tiaras.get('fire')
    }],
    ['body', {
        id: 559,
        xp: 7.5,
        level: 20,
        essence: [itemIds.essence.pure, itemIds.essence.rune],
        altar: altars.get('body'),
        talisman: talismans.get('body'),
        tiara: tiaras.get('body')
    }],
    ['cosmic', {
        id: 564,
        xp: 8.0,
        level: 27,
        essence: [itemIds.essence.pure],
        altar: altars.get('cosmic'),
        talisman: talismans.get('cosmic'),
        tiara: tiaras.get('cosmic')
    }],
    ['chaos', {
        id: 562,
        xp: 8.5,
        level: 35,
        essence: [itemIds.essence.pure],
        altar: altars.get('chaos'),
        talisman: talismans.get('chaos'),
        tiara: tiaras.get('chaos')
    }],
    ['nature', {
        id: 561,
        xp: 9.0,
        level: 44,
        essence: [itemIds.essence.pure],
        altar: altars.get('nature'),
        talisman: talismans.get('nature'),
        tiara: tiaras.get('nature')
    }],
    ['law', {
        id: 563,
        xp: 9.5,
        level: 54,
        essence: [itemIds.essence.pure],
        altar: altars.get('law'),
        talisman: talismans.get('law'),
        tiara: tiaras.get('law')
    }],
    ['death', {
        id: 560,
        xp: 10.0,
        level: 65,
        essence: [itemIds.essence.pure],
        altar: altars.get('death'),
        talisman: talismans.get('death'),
        tiara: tiaras.get('death')
    }],
]);



export function getEntityByAttr<T>(entities: Map<any, T>, attr: string, value: any): T {
    let entity = undefined;
    const splits = attr.split('.');

    // Handles dot seperated attribute names.
    if (splits.length === 2) {
        entities.forEach((e) => {
            if (e[splits[0]][splits[1]] === value) { entity = e; }
        });
    }

    // Handles single attribute name.
    if (splits.length === 1) {
        entities.forEach((e) => {
            if (e[attr] === value) { entity = e; }
        });
    }

    return entity;
}

export function getEntityIds<T>(entities: Map<any, T>, property: keyof T): number[] {
    const entityIds : number[] = [];
    entities.forEach((entity: T) => {
        if(entity.hasOwnProperty(property) && typeof entity[property] === 'number') {
            const tempnum: number = entity[property] as any;
            entityIds.push(tempnum);
        }
    }); return entityIds;
}

export function runeMultiplier(runeId: number, level: number): number {
    switch (runeId) {
        case 556: return (Math.floor((level / 11.0)) + 1);
        case 558: return (Math.floor((level / 14.0)) + 1);
        case 555: return (Math.floor((level / 19.0)) + 1);
        case 557: return (Math.floor((level / 26.0)) + 1);
        case 554: return (Math.floor((level / 35.0)) + 1);
        case 559: return (Math.floor((level / 46.0)) + 1);
        case 564: return (Math.floor((level / 59.0)) + 1);
        case 562: return (Math.floor((level / 74.0)) + 1);
        case 561: return (Math.floor((level / 91.0)) + 1);
        case 563: return 1.0;
        case 560: return 1.0;
    }
}

