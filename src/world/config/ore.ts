interface IOre {
    objects: Map<number, number>;
    itemId: number;
    level: number;
    experience: number;
    respawn: number;
    chance: number;
    chanceOffset: number;
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


const Ores: IOre[] = [
    {objects: CLAY_OBJECTS, itemId: 434, level: 1, experience: 5.0, respawn: 1, chance: 0.0085, chanceOffset: 0.45},
    {objects: COPPER_OBJECTS, itemId: 436, level: 1, experience: 17.5, respawn: 4, chance: 0.0085, chanceOffset: 0.45},
    {objects: TIN_OBJECTS, itemId: 438, level: 1, experience: 17.5, respawn: 4, chance: 0.0085, chanceOffset: 0.45},
    {objects: IRON_OBJECTS, itemId: 440, level: 15, experience: 35.0, respawn: 9, chance: 0.0085, chanceOffset: 0.45},
    {objects: COAL_OBJECTS, itemId: 453, level: 30, experience: 50.0, respawn: 50, chance: 0.004, chanceOffset: 0},
    {objects: SILVER_OBJECTS, itemId: 442, level: 20, experience: 40.0, respawn: 100, chance: 0.0085, chanceOffset: 0},
    {objects: GOLD_OBJECTS, itemId: 444, level: 40, experience: 65.0, respawn: 100, chance: 0.003, chanceOffset: 0},
    {objects: MITHRIL_OBJECTS, itemId: 447, level: 55, experience: 80.0, respawn: 200, chance: 0.002, chanceOffset: 0},
    {objects: ADAMANT_OBJECTS, itemId: 449, level: 70, experience: 95.0, respawn: 800, chance: 0.001, chanceOffset: 0},
    {objects: RUNITE_OBJECTS, itemId: 451, level: 85, experience: 125.0, respawn: 1200, chance: 0.0008, chanceOffset: 0}
];

export function getOre(ore: Ore): IOre {
    return Ores[ore];
}

export function getOreFromRock(id: number): IOre {
    return Ores.find(ore => ore.objects.has(id));
}

export function getOreFromDepletedRock(id: number): IOre {
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
