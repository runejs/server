import { objectIds } from '@server/world/config/object-ids';

export interface IHarvestable {
    objects: Map<number, number>;
    itemId: number;
    level: number;
    experience: number;
    respawnLow: number;
    respawnHigh: number;
    baseChance: number;
    break: number;
}


// Object maps work with key is mineable object, value is empty ore
const CLAY_OBJECTS: Map<number, number> = new Map<number, number>([
    ...objectIds.default.clay.map((tree) => [tree.default, tree.empty]),
] as [number, number][]);

const COPPER_OBJECTS: Map<number, number> = new Map<number, number>([
    ...objectIds.default.copper.map((tree) => [tree.default, tree.empty]),
] as [number, number][]);

const TIN_OBJECTS: Map<number, number> = new Map<number, number>([
    ...objectIds.default.tin.map((tree) => [tree.default, tree.empty]),
] as [number, number][]);

const IRON_OBJECTS: Map<number, number> = new Map<number, number>([
    ...objectIds.default.iron.map((tree) => [tree.default, tree.empty]),
] as [number, number][]);

const COAL_OBJECTS: Map<number, number> = new Map<number, number>([
    ...objectIds.default.coal.map((tree) => [tree.default, tree.empty]),
] as [number, number][]);

const SILVER_OBJECTS: Map<number, number> = new Map<number, number>([
    ...objectIds.default.silver.map((tree) => [tree.default, tree.empty]),
] as [number, number][]);

const GOLD_OBJECTS: Map<number, number> = new Map<number, number>([
    ...objectIds.default.gold.map((tree) => [tree.default, tree.empty]),
] as [number, number][]);

const MITHRIL_OBJECTS: Map<number, number> = new Map<number, number>([
    ...objectIds.default.mithril.map((tree) => [tree.default, tree.empty]),
] as [number, number][]);


const ADAMANT_OBJECTS: Map<number, number> = new Map<number, number>([
    ...objectIds.default.adamant.map((tree) => [tree.default, tree.empty]),
] as [number, number][]);

const RUNITE_OBJECTS: Map<number, number> = new Map<number, number>([
    ...objectIds.default.runite.map((tree) => [tree.default, tree.empty]),
] as [number, number][]);

const NORMAL_OBJECTS: Map<number, number> = new Map<number, number>([
    ...objectIds.tree.normal.map((tree) => [tree.default, tree.stump]),
    ...objectIds.tree.dead.map((tree) => [tree.default, tree.stump]),
] as [number, number][]);

const ACHEY_OBJECTS: Map<number, number> = new Map<number, number>([
    ...objectIds.tree.archey.map((tree) => [tree.default, tree.stump]),
] as [number, number][]);

const OAK_OBJECTS: Map<number, number> = new Map<number, number>([
    ...objectIds.tree.oak.map((tree) => [tree.default, tree.stump]),
] as [number, number][]);


const WILLOW_OBJECTS: Map<number, number> = new Map<number, number>([
    ...objectIds.tree.willow.map((tree) => [tree.default, tree.stump]),
] as [number, number][]);


const TEAK_OBJECTS: Map<number, number> = new Map<number, number>([
    ...objectIds.tree.teak.map((tree) => [tree.default, tree.stump]),
] as [number, number][]);


const MAPLE_OBJECTS: Map<number, number> = new Map<number, number>([
    ...objectIds.tree.maple.map((tree) => [tree.default, tree.stump]),
] as [number, number][]);


const MAHOGANY_OBJECTS: Map<number, number> = new Map<number, number>([
    ...objectIds.tree.mahogany.map((tree) => [tree.default, tree.stump]),
] as [number, number][]);


const YEW_OBJECTS: Map<number, number> = new Map<number, number>([
    ...objectIds.tree.yew.map((tree) => [tree.default, tree.stump]),
] as [number, number][]);

const MAGIC_OBJECTS: Map<number, number> = new Map<number, number>([
    ...objectIds.tree.magic.map((tree) => [tree.default, tree.stump]),
] as [number, number][]);

export enum Ore {
    CLAY,
    COPPER,
    TIN,
    IRON,
    COAL,
    SILVER,
    GOLD,
    MITHIL,
    ADAMANT,
    RUNITE,
    RUNE_ESS,
    GEM
}


export enum Tree {
    NORMAL,
    ACHEY,
    OAK,
    WILLOW,
    TEAK,
    MAPLE,
    MAHOGANY,
    YEW,
    MAGIC,
}


const Ores: IHarvestable[] = [
    {
        objects: CLAY_OBJECTS,
        itemId: 434,
        level: 1,
        experience: 5.0,
        respawnLow: 5,
        respawnHigh: 10,
        baseChance: 70,
        break: 100
    },
    {
        objects: COPPER_OBJECTS,
        itemId: 436,
        level: 1,
        experience: 17.5,
        respawnLow: 10,
        respawnHigh: 20,
        baseChance: 70,
        break: 100
    },
    {
        objects: TIN_OBJECTS,
        itemId: 438,
        level: 1,
        experience: 17.5,
        respawnLow: 10,
        respawnHigh: 20,
        baseChance: 70,
        break: 100
    },
    {
        objects: IRON_OBJECTS,
        itemId: 440,
        level: 15,
        experience: 35.0,
        respawnLow: 9,
        respawnHigh: 9,
        baseChance: 0.0085,
        break: 100
    },
    {
        objects: COAL_OBJECTS,
        itemId: 453,
        level: 30,
        experience: 50.0,
        respawnLow: 20,
        respawnHigh: 30,
        baseChance: 50,
        break: 100
    },
    {
        objects: SILVER_OBJECTS,
        itemId: 442,
        level: 20,
        experience: 40.0,
        respawnLow: 30,
        respawnHigh: 40,
        baseChance: 40,
        break: 100
    },
    {
        objects: GOLD_OBJECTS,
        itemId: 444,
        level: 40,
        experience: 65.0,
        respawnLow: 50,
        respawnHigh: 70,
        baseChance: 30,
        break: 100
    },
    {
        objects: MITHRIL_OBJECTS,
        itemId: 447,
        level: 55,
        experience: 65.0,
        respawnLow: 90,
        respawnHigh: 120,
        baseChance: 20,
        break: 100
    },
    {
        objects: ADAMANT_OBJECTS,
        itemId: 449,
        level: 70,
        experience: 95.0,
        respawnLow: 200,
        respawnHigh: 400,
        baseChance: 0,
        break: 100
    },
    {
        objects: RUNITE_OBJECTS,
        itemId: 451,
        level: 85,
        experience: 125.0,
        respawnLow: 1200,
        respawnHigh: 1200,
        baseChance: -10,
        break: 100
    },
    {
        objects: new Map<number, number>([[2111, 450]]), // Gem rocks
        itemId: 1625,
        level: 40,
        experience: 65.0,
        respawnLow: 200,
        respawnHigh: 400,
        baseChance: 30,
        break: 100
    }
];

const Trees: IHarvestable[] = [
    {
        objects: NORMAL_OBJECTS,
        itemId: 1511,
        level: 1,
        experience: 25,
        respawnLow: 10,
        respawnHigh: 20,
        baseChance: 70,
        break: 100
    },
    {
        objects: ACHEY_OBJECTS,
        itemId: 2862,
        level: 1,
        experience: 25,
        respawnLow: 10,
        respawnHigh: 20,
        baseChance: 70,
        break: 100
    },
    {
        objects: OAK_OBJECTS,
        itemId: 1521,
        level: 15,
        experience: 37.5,
        respawnLow: 20,
        respawnHigh: 30,
        baseChance: 50,
        break: 100 / 8
    },
    {
        objects: WILLOW_OBJECTS,
        itemId: 1519,
        level: 30,
        experience: 67.5,
        respawnLow: 40,
        respawnHigh: 50,
        baseChance: 30,
        break: 100 / 8
    },
    {
        objects: TEAK_OBJECTS,
        itemId: 6333,
        level: 35,
        experience: 85,
        respawnLow: 50,
        respawnHigh: 60,
        baseChance: 0,
        break: 100 / 8
    },
    {
        objects: MAPLE_OBJECTS,
        itemId: 1517,
        level: 45,
        experience: 100,
        respawnLow: 100,
        respawnHigh: 120,
        baseChance: 0,
        break: 100 / 8
    },
    {
        objects: MAHOGANY_OBJECTS,
        itemId: 6332,
        level: 50,
        experience: 125,
        respawnLow: 200,
        respawnHigh: 220,
        baseChance: -5,
        break: 100 / 8
    },
    {
        objects: YEW_OBJECTS,
        itemId: 1515,
        level: 60,
        experience: 175,
        respawnLow: 300,
        respawnHigh: 320,
        baseChance: -15,
        break: 100 / 8
    },
    {
        objects: MAGIC_OBJECTS,
        itemId: 1513,
        level: 75,
        experience: 250,
        respawnLow: 800,
        respawnHigh: 820,
        baseChance: -25,
        break: 100 / 8
    },
];

export function getOre(ore: Ore): IHarvestable {
    return Ores[ore];
}

export function getOreFromRock(id: number): IHarvestable {
    return Ores.find(ore => ore.objects.has(id));
}

export function getTreeFromHealthy(id: number): IHarvestable {
    return Trees.find(tree => tree.objects.has(id));
}

export function getOreFromDepletedRock(id: number): IHarvestable {
    return Ores.find(ore => {
        for (const [rock, expired] of ore.objects) {
            if (expired === id) {
                return true;
            }
        }
        return false;
    });
}

export function getAllOreIds(): number[] {
    const oreIds: number[] = [];
    for (const ore of Ores) {
        for (const [rock, expired] of ore.objects) {
            oreIds.push(rock);
            oreIds.push(expired);
        }
    }
    return oreIds;
}

export function getTreeIds(): number[] {
    const treeIds: number[] = [];
    for (const tree of Trees) {
        for (const [healthy, expired] of tree.objects) {
            treeIds.push(healthy);
        }
    }
    return treeIds;
}
