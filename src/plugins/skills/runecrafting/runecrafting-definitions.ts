interface Position {
    x: number;
    y: number;
}

interface Tiara {
    id: number;
}

interface Talisman {
    id: number;
}

interface Altar {
    entranceId: number;
    craftingId: number;
    portalId: number;
    entrance: Position;
    exit: Position;
}

interface Rune {
    id: number;
    tiara: Tiara;
    talisman: Talisman;
}

export const tiaras : Map<string, Tiara> = new Map<string, Tiara>([
    ['air', {id: 5527}],
    ['mind', {id: 5529}],
    ['water', {id: 5531}],
    ['body', {id: 5533}],
    ['earth', {id: 5535}],
    ['fire', {id: 5537}],
    ['cosmic', {id: 5539}],
    ['nature', {id: 5541}],
    ['chaos', {id: 5543}],
    ['law', {id: 5545}],
    ['death', {id: 5548}],
]);

export const talismans : Map<string, Talisman> = new Map<string, Talisman>([
    ['air', {id: 1438}],
    ['mind', {id: 1440}],
    ['water', {id: 1442}],
    ['body', {id: 1444}],
    ['earth', {id: 1446}],
    ['fire', {id: 1448}],
    ['cosmic', {id: 1452}],
    ['nature', {id: 1454}],
    ['chaos', {id: 1456}],
    ['law', {id: 1458}],
    ['death', {id: 1462}],
]);

export const altars : Map<string, Altar> = new Map<string, Altar>([
    ['air', {entranceId: 2452, craftingId: 2478, portalId: 2465, entrance: {x: 2841, y: 4829}, exit: {x: 2983, y: 3292}}],
    ['mind', {entranceId: 2453, craftingId: 2479, portalId: 2466, entrance: {x: 2793, y: 4828}, exit: {x: 2980, y: 3514}}],
]);
