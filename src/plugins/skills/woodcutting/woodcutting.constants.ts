import { randomBetween } from '@engine/util/num';
import { IHarvestable, WeightedItem } from '@engine/world/config/harvestable-object';
import { itemIds } from '@engine/world/config/item-ids';
import { objectIds } from '@engine/world/config/object-ids';
import { soundIds } from '@engine/world/config/sound-ids';

export const WOODCUTTING_SOUNDS = {
    CHOP: soundIds.axeSwing, // Array of [88, 89, 90]
    TREE_DEPLETED: soundIds.oreDepeleted, // 3600
};

interface AxeData {
    level: number;
    animationId: number;
    bonus: number;
}

export const AXES = new Map<number, AxeData>([
    [itemIds.axes.runite, { level: 41, animationId: 867, bonus: 8 }],
    [itemIds.axes.adamantite, { level: 31, animationId: 869, bonus: 7 }],
    [itemIds.axes.mithril, { level: 21, animationId: 871, bonus: 6 }],
    // [itemIds.axes.black, { level: 11, animationId: 873, bonus: 5 }],
    [itemIds.axes.steel, { level: 6, animationId: 875, bonus: 4 }],
    [itemIds.axes.iron, { level: 1, animationId: 877, bonus: 3 }],
    [itemIds.axes.bronze, { level: 1, animationId: 879, bonus: 2 }],
]);

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

const Trees: IHarvestable[] = [
    {
        objects: NORMAL_OBJECTS,
        items: 'rs:logs',
        level: 1,
        experience: 25,
        respawnLow: 27,
        respawnHigh: 45,
        baseChance: 70,
        break: 100,
    },
    {
        objects: ACHEY_OBJECTS,
        items: 'rs:achey_logs',
        level: 1,
        experience: 25,
        respawnLow: 27,
        respawnHigh: 45,
        baseChance: 70,
        break: 100,
    },
    {
        objects: OAK_OBJECTS,
        items: 'rs:oak_logs',
        level: 15,
        experience: 37.5,
        respawnLow: 50,
        respawnHigh: 100,
        baseChance: 50,
        break: 100 / 8,
    },
    {
        objects: WILLOW_OBJECTS,
        items: 'rs:willow_logs',
        level: 30,
        experience: 67.5,
        respawnLow: 50,
        respawnHigh: 100,
        baseChance: 30,
        break: 100 / 8,
    },
    {
        objects: TEAK_OBJECTS,
        items: 'rs:teak_logs',
        level: 35,
        experience: 85,
        respawnLow: 100,
        respawnHigh: 150,
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
        respawnLow: 100,
        respawnHigh: 200,
        baseChance: 0,
        break: 100 / 8,
    },
    {
        objects: HOLLOW_OBJECTS,
        items: 'rs:bark', // You'll need to add this to logs.json
        level: 45,
        experience: 82.5,
        respawnLow: 27,
        respawnHigh: 45,
        baseChance: 0,
        break: 100 / 8,
    },
    {
        objects: MAHOGANY_OBJECTS,
        items: 'rs:mahogany_logs',
        level: 50,
        experience: 125,
        respawnLow: 150,
        respawnHigh: 250,
        baseChance: -5,
        break: 100 / 8,
    },
    {
        objects: YEW_OBJECTS,
        items: 'rs:yew_logs',
        level: 60,
        experience: 175,
        respawnLow: 167,
        respawnHigh: 300,
        baseChance: -15,
        break: 100 / 8,
    },
    {
        objects: MAGIC_OBJECTS,
        items: 'rs:magic_logs',
        level: 75,
        experience: 250,
        respawnLow: 200,
        respawnHigh: 500,
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

export function getTreeIds(): number[] {
    const treeIds: number[] = [];
    for (const tree of Trees) {
        for (const [healthy, expired] of tree.objects) {
            treeIds.push(healthy);
        }
    }
    return treeIds;
}
export function getTreeFromHealthy(id: number): IHarvestable {
    return Trees.find(tree => tree.objects.has(id)) as IHarvestable;
}

export function selectWeightedItem(items: string | WeightedItem[]): string {
    if (typeof items === 'string') {
        return items;
    }
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

export function getPrimaryItem(items: string | WeightedItem[]): string {
    if (typeof items === 'string') {
        return items;
    }
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
