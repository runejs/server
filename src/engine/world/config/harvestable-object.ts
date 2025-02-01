import { randomBetween } from '@engine/util/num';
import { objectIds } from '@engine/world/config/object-ids';

interface WeightedItem {
    itemConfigId: string;
    weight: number;
}

export interface IHarvestable {
    objects: Map<number, number>;
    items: string | WeightedItem[];
    level: number;
    experience: number;
    respawnLow: number;
    respawnHigh: number;
    baseChance: number;
    break: number;
}

// Object maps work with key is mineable object, value is empty ore
const CLAY_OBJECTS: Map<number, number> = new Map<number, number>([...objectIds.default.clay.map(tree => [tree.default, tree.empty])] as [
    number,
    number,
][]);

const COPPER_OBJECTS: Map<number, number> = new Map<number, number>([
    ...objectIds.default.copper.map(tree => [tree.default, tree.empty]),
] as [number, number][]);

const TIN_OBJECTS: Map<number, number> = new Map<number, number>([...objectIds.default.tin.map(tree => [tree.default, tree.empty])] as [
    number,
    number,
][]);

const IRON_OBJECTS: Map<number, number> = new Map<number, number>([...objectIds.default.iron.map(tree => [tree.default, tree.empty])] as [
    number,
    number,
][]);

const COAL_OBJECTS: Map<number, number> = new Map<number, number>([...objectIds.default.coal.map(tree => [tree.default, tree.empty])] as [
    number,
    number,
][]);

const SILVER_OBJECTS: Map<number, number> = new Map<number, number>([
    ...objectIds.default.silver.map(tree => [tree.default, tree.empty]),
] as [number, number][]);

const GOLD_OBJECTS: Map<number, number> = new Map<number, number>([...objectIds.default.gold.map(tree => [tree.default, tree.empty])] as [
    number,
    number,
][]);

const MITHRIL_OBJECTS: Map<number, number> = new Map<number, number>([
    ...objectIds.default.mithril.map(tree => [tree.default, tree.empty]),
] as [number, number][]);

const ADAMANT_OBJECTS: Map<number, number> = new Map<number, number>([
    ...objectIds.default.adamant.map(tree => [tree.default, tree.empty]),
] as [number, number][]);

const RUNITE_OBJECTS: Map<number, number> = new Map<number, number>([
    ...objectIds.default.runite.map(tree => [tree.default, tree.empty]),
] as [number, number][]);

const NORMAL_OBJECTS: Map<number, number> = new Map<number, number>([
    ...objectIds.tree.normal.map(tree => [tree.default, tree.stump]),
    ...objectIds.tree.dead.map(tree => [tree.default, tree.stump]),
] as [number, number][]);

const ACHEY_OBJECTS: Map<number, number> = new Map<number, number>([...objectIds.tree.archey.map(tree => [tree.default, tree.stump])] as [
    number,
    number,
][]);

const OAK_OBJECTS: Map<number, number> = new Map<number, number>([...objectIds.tree.oak.map(tree => [tree.default, tree.stump])] as [
    number,
    number,
][]);

const WILLOW_OBJECTS: Map<number, number> = new Map<number, number>([...objectIds.tree.willow.map(tree => [tree.default, tree.stump])] as [
    number,
    number,
][]);

const TEAK_OBJECTS: Map<number, number> = new Map<number, number>([...objectIds.tree.teak.map(tree => [tree.default, tree.stump])] as [
    number,
    number,
][]);

const DRAMEN_OBJECTS: Map<number, number> = new Map<number, number>([...objectIds.tree.dramen.map(tree => [tree.default, tree.stump])] as [
    number,
    number,
][]);

const MAPLE_OBJECTS: Map<number, number> = new Map<number, number>([...objectIds.tree.maple.map(tree => [tree.default, tree.stump])] as [
    number,
    number,
][]);

const HOLLOW_OBJECTS: Map<number, number> = new Map<number, number>([...objectIds.tree.hollow.map(tree => [tree.default, tree.stump])] as [
    number,
    number,
][]);

const MAHOGANY_OBJECTS: Map<number, number> = new Map<number, number>([
    ...objectIds.tree.mahogany.map(tree => [tree.default, tree.stump]),
] as [number, number][]);

const YEW_OBJECTS: Map<number, number> = new Map<number, number>([...objectIds.tree.yew.map(tree => [tree.default, tree.stump])] as [
    number,
    number,
][]);

const MAGIC_OBJECTS: Map<number, number> = new Map<number, number>([...objectIds.tree.magic.map(tree => [tree.default, tree.stump])] as [
    number,
    number,
][]);

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
    GEM,
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
    HOLLOW,
    DRAMEN,
}

export function selectWeightedItem(items: WeightedItem[]): string {
    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    let random = randomBetween(1, totalWeight);

    for (const item of items) {
        random -= item.weight;
        if (random <= 0) {
            return item.itemConfigId;
        }
    }

    return items[0].itemConfigId; // Fallback to first item
}

const Ores: IHarvestable[] = [
    {
        objects: CLAY_OBJECTS,
        items: 'rs:clay',
        level: 1,
        experience: 5.0,
        respawnLow: 5,
        respawnHigh: 10,
        baseChance: 70,
        break: 100,
    },
    {
        objects: COPPER_OBJECTS,
        items: 'rs:copper_ore',
        level: 1,
        experience: 17.5,
        respawnLow: 10,
        respawnHigh: 20,
        baseChance: 70,
        break: 100,
    },
    {
        objects: TIN_OBJECTS,
        items: 'rs:tin_ore',
        level: 1,
        experience: 17.5,
        respawnLow: 10,
        respawnHigh: 20,
        baseChance: 70,
        break: 100,
    },
    {
        objects: IRON_OBJECTS,
        items: 'rs:iron_ore',
        level: 15,
        experience: 35.0,
        respawnLow: 9,
        respawnHigh: 9,
        baseChance: 0.0085,
        break: 100,
    },
    {
        objects: COAL_OBJECTS,
        items: 'rs:coal',
        level: 30,
        experience: 50.0,
        respawnLow: 20,
        respawnHigh: 30,
        baseChance: 50,
        break: 100,
    },
    {
        objects: SILVER_OBJECTS,
        items: 'rs:silver_ore',
        level: 20,
        experience: 40.0,
        respawnLow: 30,
        respawnHigh: 40,
        baseChance: 40,
        break: 100,
    },
    {
        objects: GOLD_OBJECTS,
        items: 'rs:gold_ore',
        level: 40,
        experience: 65.0,
        respawnLow: 50,
        respawnHigh: 70,
        baseChance: 30,
        break: 100,
    },
    {
        objects: MITHRIL_OBJECTS,
        items: 'rs:mithril_ore',
        level: 55,
        experience: 65.0,
        respawnLow: 90,
        respawnHigh: 120,
        baseChance: 20,
        break: 100,
    },
    {
        objects: ADAMANT_OBJECTS,
        items: 'rs:adamantite_ore',
        level: 70,
        experience: 95.0,
        respawnLow: 200,
        respawnHigh: 400,
        baseChance: 0,
        break: 100,
    },
    {
        objects: RUNITE_OBJECTS,
        items: 'rs:runite_ore',
        level: 85,
        experience: 125.0,
        respawnLow: 1200,
        respawnHigh: 1200,
        baseChance: -10,
        break: 100,
    },
    {
        objects: new Map<number, number>([[2111, 450]]),
        items: [
            { itemConfigId: 'rs:uncut_opal', weight: 60 }, // 60/128
            { itemConfigId: 'rs:uncut_jade', weight: 30 }, // 30/128
            { itemConfigId: 'rs:uncut_red_topaz', weight: 15 }, // 15/128
            { itemConfigId: 'rs:uncut_sapphire', weight: 9 }, // 9/128
            { itemConfigId: 'rs:uncut_emerald', weight: 5 }, // 5/128
            { itemConfigId: 'rs:uncut_ruby', weight: 5 }, // 5/128
            { itemConfigId: 'rs:uncut_diamond', weight: 4 }, // 4/128
        ],
        level: 40,
        experience: 65.0,
        respawnLow: 200,
        respawnHigh: 400,
        baseChance: 28, // Base success chance at level 40
        break: 100, // Always depletes after successful mining
    },
];

const Trees: IHarvestable[] = [
    {
        objects: NORMAL_OBJECTS,
        items: 'rs:logs',
        level: 1,
        experience: 25,
        respawnLow: 59,
        respawnHigh: 98,
        baseChance: 70,
        break: 100,
    },
    {
        objects: ACHEY_OBJECTS,
        items: 'rs:achey_logs',
        level: 1,
        experience: 25,
        respawnLow: 59,
        respawnHigh: 98,
        baseChance: 70,
        break: 100,
    },
    {
        objects: OAK_OBJECTS,
        items: 'rs:oak_logs',
        level: 15,
        experience: 37.5,
        respawnLow: 14,
        respawnHigh: 14,
        baseChance: 50,
        break: 100 / 8,
    },
    {
        objects: WILLOW_OBJECTS,
        items: 'rs:willow_logs',
        level: 30,
        experience: 67.5,
        respawnLow: 14,
        respawnHigh: 14,
        baseChance: 30,
        break: 100 / 8,
    },
    {
        objects: TEAK_OBJECTS,
        items: 'rs:teak_logs',
        level: 35,
        experience: 85,
        respawnLow: 15,
        respawnHigh: 15,
        baseChance: 0,
        break: 100 / 8,
    },
    {
        objects: DRAMEN_OBJECTS,
        items: 'rs:dramen_branch', // You'll need to add this to logs.json
        level: 36,
        experience: 0,
        respawnLow: 0,
        respawnHigh: 0,
        baseChance: 100,
        break: 0,
    },
    {
        objects: MAPLE_OBJECTS,
        items: 'rs:maple_logs',
        level: 45,
        experience: 100,
        respawnLow: 59,
        respawnHigh: 59,
        baseChance: 0,
        break: 100 / 8,
    },
    {
        objects: HOLLOW_OBJECTS,
        items: 'rs:bark', // You'll need to add this to logs.json
        level: 45,
        experience: 82.5,
        respawnLow: 43,
        respawnHigh: 44,
        baseChance: 0,
        break: 100 / 8,
    },
    {
        objects: MAHOGANY_OBJECTS,
        items: 'rs:mahogany_logs',
        level: 50,
        experience: 125,
        respawnLow: 14,
        respawnHigh: 14,
        baseChance: -5,
        break: 100 / 8,
    },
    {
        objects: YEW_OBJECTS,
        items: 'rs:yew_logs',
        level: 60,
        experience: 175,
        respawnLow: 99,
        respawnHigh: 99,
        baseChance: -15,
        break: 100 / 8,
    },
    {
        objects: MAGIC_OBJECTS,
        items: 'rs:magic_logs',
        level: 75,
        experience: 250,
        respawnLow: 199,
        respawnHigh: 199,
        baseChance: -25,
        break: 100 / 8,
    },
    {
        objects: DRAMEN_OBJECTS,
        items: 'rs:dramen_branch',
        level: 36,
        experience: 0,
        respawnLow: 0,
        respawnHigh: 0,
        baseChance: 100,
        break: 0,
    },
    {
        objects: HOLLOW_OBJECTS,
        items: 'rs:bark',
        level: 45,
        experience: 82.5,
        respawnLow: 43,
        respawnHigh: 44,
        baseChance: 0,
        break: 100 / 8,
    },
];

export function getOre(ore: Ore): IHarvestable {
    return Ores[ore];
}

export function getOreFromRock(id: number): IHarvestable {
    return Ores.find(ore => ore.objects.has(id)) as IHarvestable;
}

export function getTreeFromHealthy(id: number): IHarvestable {
    return Trees.find(tree => tree.objects.has(id)) as IHarvestable;
}

export function getOreFromDepletedRock(id: number): IHarvestable {
    return Ores.find(ore => {
        for (const [_, expired] of ore.objects) {
            if (expired === id) {
                return true;
            }
        }
        return false;
    }) as IHarvestable;
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
        for (const [healthy] of tree.objects) {
            treeIds.push(healthy);
        }
    }
    return treeIds;
}
