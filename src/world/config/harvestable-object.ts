export interface IHarvestable {
    objects: Map<number, number>;
    itemId: number;
    level: number;
    experience: number;
    respawn: number;
    chance: number;
    chanceOffset: number;
    break: number;
}


// Object maps work with key is mineable object, value is empty ore
const CLAY_OBJECTS: Map<number, number> = new Map<number, number>([
    [2108, 450],
    [2109, 451],
    [14904, 14896],
    [14905, 14897]
]);

const COPPER_OBJECTS: Map<number, number> = new Map<number, number>([
    [11960, 11555],
    [11961, 11556],
    [11962, 11557],
    [11936, 11552],
    [11937, 11553],
    [11938, 11554],
    [2090, 450],
    [2091, 451],
    [14906, 14898],
    [14907, 14899],
    [14856, 14832],
    [14857, 14833],
    [14858, 14834]
]);

const TIN_OBJECTS: Map<number, number> = new Map<number, number>([
    [11597, 11555],
    [11958, 11556],
    [11959, 11557],
    [11933, 11552],
    [11934, 11553],
    [11935, 11554],
    [2094, 450],
    [2095, 451],
    [14092, 14894],
    [14903, 14895]
]);

const IRON_OBJECTS: Map<number, number> = new Map<number, number>([
    [11954, 11555],
    [11955, 11556],
    [11956, 11557],
    [2092, 450],
    [2093, 451],
    [14900, 14892],
    [14901, 14893],
    [14913, 14915],
    [14914, 14916]
]);

const COAL_OBJECTS: Map<number, number> = new Map<number, number>([
    [11963, 11555],
    [11964, 11556],
    [11965, 11557],
    [11930, 11552],
    [11931, 11553],
    [11932, 11554],
    [2096, 450],
    [2097, 451],
    [14850, 14832],
    [14851, 14833],
    [14852, 14834]
]);

const SILVER_OBJECTS: Map<number, number> = new Map<number, number>([
    [11948, 11555],
    [11949, 11556],
    [11950, 11557],
    [2100, 450],
    [2101, 451]
]);

const GOLD_OBJECTS: Map<number, number> = new Map<number, number>([
    [11951, 11555],
    [11952, 11556],
    [11953, 11557],
    [2098, 450],
    [2099, 451]
]);

const MITHRIL_OBJECTS: Map<number, number> = new Map<number, number>([
    [11945, 11555],
    [11946, 11556],
    [11947, 11557],
    [11942, 11552],
    [11943, 11553],
    [11944, 11554],
    [2102, 450],
    [2103, 451],
    [14853, 14832],
    [14854, 14833],
    [14855, 14834]
]);

const ADAMANT_OBJECTS: Map<number, number> = new Map<number, number>([
    [11939, 11552],
    [11940, 11553],
    [11941, 11554],
    [2104, 450],
    [2105, 451],
    [14862, 14832],
    [14863, 14833],
    [14864, 14834]
]);

const RUNITE_OBJECTS: Map<number, number> = new Map<number, number>([
    [2106, 450],
    [2107, 451],
    [14859, 14832],
    [14860, 14833],
    [14861, 14834]
]);

const NORMAL_OBJECTS: Map<number, number> = new Map<number, number>([
    [1276, 1342],
    [1277, 1342],
    [1278, 1342],
    [1279, 1342],
    [1280, 1342],
    [1282, 1341],
    [1283, 1341],
    [1284, 1341],
    [1285, 1341],
    [1285, 1341],
    [1286, 1341],
    [1289, 1341],
    [1290, 1341],
    [1291, 1341],
    [1315, 1342],
    [1316, 1342],
    [1318, 1342],
    [1330, 1342],
    [1331, 1342],
    [1332, 1342],
    [1365, 1342],
    [1383, 1342],
    [1384, 1342],
    [2409, 1342],
    [3033, 1342],
    [3034, 1342],
    [3035, 1342],
    [3036, 1342],
    [3881, 1342],
    [3882, 1342],
    [3883, 1342],
    [5902, 1342],
    [5903, 1342],
    [5904, 1342],
    [10041, 1342]
]);

const ACHEY_OBJECTS: Map<number, number> = new Map<number, number>([
    [2023, 3371],
]);


const OAK_OBJECTS: Map<number, number> = new Map<number, number>([
    [1281, 1342],
    [3037, 1342],
]);


const WILLOW_OBJECTS: Map<number, number> = new Map<number, number>([
    [5551, 8489],
    [1308, 8489],
    [5552, 8489],
    [5553, 8489],
    [8481, 8489],
    [8482, 8489],
    [8483, 8489],
    [8484, 8489],
    [8485, 8489],
    [8486, 8489],
    [8487, 8489],
    [8488, 8489],
]);


const TEAK_OBJECTS: Map<number, number> = new Map<number, number>([
    [9036, 1342],
]);


const MAPLE_OBJECTS: Map<number, number> = new Map<number, number>([
    [1307, 1342],
    [4674, 1342],
]);

const MAHOGANY_OBJECTS: Map<number, number> = new Map<number, number>([
    [9034, 1342],
]);

const YEW_OBJECTS: Map<number, number> = new Map<number, number>([
    [1309, 1342],
]);

const MAGIC_OBJECTS: Map<number, number> = new Map<number, number>([
    [1292, 1324],
]);


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
    RUNITE
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
        respawn: 1,
        chance: 0.0085,
        chanceOffset: 0.45,
        break: 100
    },
    {
        objects: COPPER_OBJECTS,
        itemId: 436,
        level: 1,
        experience: 17.5,
        respawn: 4,
        chance: 0.0085,
        chanceOffset: 0.45,
        break: 100
    },
    {
        objects: TIN_OBJECTS,
        itemId: 438,
        level: 1,
        experience: 17.5,
        respawn: 4,
        chance: 0.0085,
        chanceOffset: 0.45,
        break: 100
    },
    {
        objects: IRON_OBJECTS,
        itemId: 440,
        level: 15,
        experience: 35.0,
        respawn: 9,
        chance: 0.0085,
        chanceOffset: 0.45,
        break: 100
    },
    {
        objects: COAL_OBJECTS,
        itemId: 453,
        level: 30,
        experience: 50.0,
        respawn: 50,
        chance: 0.004,
        chanceOffset: 0,
        break: 100
    },
    {
        objects: SILVER_OBJECTS,
        itemId: 442,
        level: 20,
        experience: 40.0,
        respawn: 100,
        chance: 0.0085,
        chanceOffset: 0,
        break: 100
    },
    {
        objects: GOLD_OBJECTS,
        itemId: 444,
        level: 40,
        experience: 65.0,
        respawn: 100,
        chance: 0.003,
        chanceOffset: 0,
        break: 100
    },
    {
        objects: MITHRIL_OBJECTS,
        itemId: 447,
        level: 55,
        experience: 80.0,
        respawn: 200,
        chance: 0.002,
        chanceOffset: 0,
        break: 100
    },
    {
        objects: ADAMANT_OBJECTS,
        itemId: 449,
        level: 70,
        experience: 95.0,
        respawn: 800,
        chance: 0.001,
        chanceOffset: 0,
        break: 100
    },
    {
        objects: RUNITE_OBJECTS,
        itemId: 451,
        level: 85,
        experience: 125.0,
        respawn: 1200,
        chance: 0.0008,
        chanceOffset: 0,
        break: 100
    }
];

const Trees: IHarvestable[] = [
    {
        objects: NORMAL_OBJECTS,
        itemId: 1511,
        level: 1,
        experience: 25,
        respawn: 1,
        chance: 0.0085,
        chanceOffset: 0.45,
        break: 100
    },
    {
        objects: ACHEY_OBJECTS,
        itemId: 2862,
        level: 1,
        experience: 25,
        respawn: 4,
        chance: 0.0085,
        chanceOffset: 0.45,
        break: 100
    },
    {
        objects: OAK_OBJECTS,
        itemId: 1521,
        level: 15,
        experience: 37.5,
        respawn: 4,
        chance: 0.0085,
        chanceOffset: 0.45,
        break: 100 / 8
    },
    {
        objects: WILLOW_OBJECTS,
        itemId: 1519,
        level: 30,
        experience: 67.5,
        respawn: 9,
        chance: 0.0085,
        chanceOffset: 0.45,
        break: 100 / 8
    },
    {
        objects: TEAK_OBJECTS,
        itemId: 6333,
        level: 35,
        experience: 85,
        respawn: 50,
        chance: 0.004,
        chanceOffset: 0,
        break: 100 / 8
    },
    {
        objects: MAPLE_OBJECTS,
        itemId: 1517,
        level: 45,
        experience: 100,
        respawn: 100,
        chance: 0.0085,
        chanceOffset: 0,
        break: 100 / 8
    },
    {
        objects: MAHOGANY_OBJECTS,
        itemId: 6332,
        level: 50,
        experience: 125,
        respawn: 100,
        chance: 0.003,
        chanceOffset: 0,
        break: 100 / 8
    },
    {
        objects: YEW_OBJECTS,
        itemId: 1515,
        level: 60,
        experience: 175,
        respawn: 200,
        chance: 0.002,
        chanceOffset: 0,
        break: 100 / 8
    },
    {
        objects: MAGIC_OBJECTS,
        itemId: 1513,
        level: 75,
        experience: 250,
        respawn: 800,
        chance: 0.001,
        chanceOffset: 0,
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
