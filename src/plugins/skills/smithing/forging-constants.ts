import { itemIds } from '@engine/world/config/item-ids';
import { Smithable } from '@plugins/skills/smithing/forging-types';

export const anvilIds: number[] = [
    2782, 2783, 4306, 6150
];

/**
 * Map bars and levels.
 */
export const bars : Map<number, number> = new Map<number, number>([
    [itemIds.bars.bronze, 1],
    [itemIds.bars.iron, 15],
    [itemIds.bars.steel, 30],
    [itemIds.bars.mithril, 50],
    [itemIds.bars.adamantite, 70],
    [itemIds.bars.runite, 85]
]);

export const smithables : Map<string, Map<string, Smithable>> = new Map<string, Map<string, Smithable>>([
    ['dagger', new Map<string, Smithable>([
        ['bronze', {
            level: 1,
            experience: 12.5,
            item: { itemId: itemIds.daggers.bronze, amount: 1 },
            ingredient: { itemId: itemIds.bars.bronze, amount: 1 }
        }],
        ['iron', {
            level: 15,
            experience: 25,
            item: { itemId: itemIds.daggers.iron, amount: 1 },
            ingredient: { itemId: itemIds.bars.iron, amount: 1 }
        }],
        ['steel', {
            level: 30,
            experience: 37.5,
            item: { itemId: itemIds.daggers.steel, amount: 1 },
            ingredient: { itemId: itemIds.bars.steel, amount: 1 }
        }],
        ['mithril', {
            level: 50,
            experience: 50,
            item: { itemId: itemIds.daggers.mithril, amount: 1 },
            ingredient: { itemId: itemIds.bars.mithril, amount: 1 }
        }],
        ['adamant', {
            level: 70,
            experience: 62.5,
            item: { itemId: itemIds.daggers.adamant, amount: 1 },
            ingredient: { itemId: itemIds.bars.adamantite, amount: 1 }
        }],
        ['rune', {
            level: 85,
            experience: 75,
            item: { itemId: itemIds.daggers.rune, amount: 1 },
            ingredient: { itemId: itemIds.bars.runite, amount: 1 }
        }],
    ])],
    ['axe', new Map<string, Smithable>([
        ['bronze', {
            level: 1,
            experience: 12.5,
            item: { itemId: itemIds.axes.bronze, amount: 1 },
            ingredient: { itemId: itemIds.bars.bronze, amount: 1 }
        }],
        ['iron', {
            level: 16,
            experience: 25,
            item: { itemId: itemIds.axes.iron, amount: 1 },
            ingredient: { itemId: itemIds.bars.iron, amount: 1 }
        }],
        ['steel', {
            level: 31,
            experience: 37.5,
            item: { itemId: itemIds.axes.steel, amount: 1 },
            ingredient: { itemId: itemIds.bars.steel, amount: 1 }
        }],
        ['mithril', {
            level: 51,
            experience: 50,
            item: { itemId: itemIds.axes.mithril, amount: 1 },
            ingredient: { itemId: itemIds.bars.mithril, amount: 1 }
        }],
        ['adamant', {
            level: 71,
            experience: 62.5,
            item: { itemId: itemIds.axes.adamantite, amount: 1 },
            ingredient: { itemId: itemIds.bars.adamantite, amount: 1 }
        }],
        ['rune', {
            level: 86,
            experience: 75,
            item: { itemId: itemIds.axes.runite, amount: 1 },
            ingredient: { itemId: itemIds.bars.runite, amount: 1 }
        }],
    ])],
    ['mace', new Map<string, Smithable>([
        ['bronze', {
            level: 2,
            experience: 12.5,
            item: { itemId: itemIds.maces.bronze, amount: 1 },
            ingredient: { itemId: itemIds.bars.bronze, amount: 1 }
        }],
        ['iron', {
            level: 17,
            experience: 25,
            item: { itemId: itemIds.maces.iron, amount: 1 },
            ingredient: { itemId: itemIds.bars.iron, amount: 1 }
        }],
        ['steel', {
            level: 32,
            experience: 37.5,
            item: { itemId: itemIds.maces.steel, amount: 1 },
            ingredient: { itemId: itemIds.bars.steel, amount: 1 }
        }],
        ['mithril', {
            level: 52,
            experience: 50,
            item: { itemId: itemIds.maces.mithril, amount: 1 },
            ingredient: { itemId: itemIds.bars.mithril, amount: 1 }
        }],
        ['adamant', {
            level: 72,
            experience: 62.5,
            item: { itemId: itemIds.maces.adamantite, amount: 1 },
            ingredient: { itemId: itemIds.bars.adamantite, amount: 1 }
        }],
        ['rune', {
            level: 87,
            experience: 75,
            item: { itemId: itemIds.maces.runite, amount: 1 },
            ingredient: { itemId: itemIds.bars.runite, amount: 1 }
        }],
    ])],
    ['mediumHelm', new Map<string, Smithable>([
        ['bronze', {
            level: 3,
            experience: 12.5,
            item: { itemId: itemIds.mediumHelmets.bronze, amount: 1 },
            ingredient: { itemId: itemIds.bars.bronze, amount: 1 }
        }],
        ['iron', {
            level: 18,
            experience: 25,
            item: { itemId: itemIds.mediumHelmets.iron, amount: 1 },
            ingredient: { itemId: itemIds.bars.iron, amount: 1 }
        }],
        ['steel', {
            level: 33,
            experience: 37.5,
            item: { itemId: itemIds.mediumHelmets.steel, amount: 1 },
            ingredient: { itemId: itemIds.bars.steel, amount: 1 }
        }],
        ['mithril', {
            level: 53,
            experience: 50,
            item: { itemId: itemIds.mediumHelmets.mithril, amount: 1 },
            ingredient: { itemId: itemIds.bars.mithril, amount: 1 }
        }],
        ['adamant', {
            level: 73,
            experience: 62.5,
            item: { itemId: itemIds.mediumHelmets.adamantite, amount: 1 },
            ingredient: { itemId: itemIds.bars.adamantite, amount: 1 }
        }],
        ['rune', {
            level: 88,
            experience: 75,
            item: { itemId: itemIds.mediumHelmets.runite, amount: 1 },
            ingredient: { itemId: itemIds.bars.runite, amount: 1 }
        }]
    ])],
    ['bolts', new Map<string, Smithable>([
        ['bronze', {
            level: 3,
            experience: 12.5,
            item: { itemId: itemIds.bolts.bronze, amount: 15 },
            ingredient: { itemId: itemIds.bars.bronze, amount: 1 }
        }],
        ['iron', {
            level: 18,
            experience: 25,
            item: { itemId: itemIds.bolts.iron, amount: 15 },
            ingredient: { itemId: itemIds.bars.iron, amount: 1 }
        }],
        ['steel', {
            level: 33,
            experience: 37.5,
            item: { itemId: itemIds.bolts.steel, amount: 15 },
            ingredient: { itemId: itemIds.bars.steel, amount: 1 }
        }],
        ['mithril', {
            level: 53,
            experience: 50,
            item: { itemId: itemIds.bolts.mithril, amount: 15 },
            ingredient: { itemId: itemIds.bars.mithril, amount: 1 }
        }],
        ['adamant', {
            level: 73,
            experience: 62.5,
            item: { itemId: itemIds.bolts.adamantite, amount: 15 },
            ingredient: { itemId: itemIds.bars.adamantite, amount: 1 }
        }],
        ['rune', {
            level: 88,
            experience: 75,
            item: { itemId: itemIds.bolts.runite, amount: 15 },
            ingredient: { itemId: itemIds.bars.runite, amount: 1 }
        }],
    ])],
    ['sword', new Map<string, Smithable>([
        ['bronze', {
            level: 4,
            experience: 12.5,
            item: { itemId: itemIds.swords.bronze, amount: 1 },
            ingredient: { itemId: itemIds.bars.bronze, amount: 1 }
        }],
        ['iron', {
            level: 19,
            experience: 25,
            item: { itemId: itemIds.swords.iron, amount: 1 },
            ingredient: { itemId: itemIds.bars.iron, amount: 1 }
        }],
        ['steel', {
            level: 34,
            experience: 37.5,
            item: { itemId: itemIds.swords.steel, amount: 1 },
            ingredient: { itemId: itemIds.bars.steel, amount: 1 }
        }],
        ['mithril', {
            level: 54,
            experience: 50,
            item: { itemId: itemIds.swords.mithril, amount: 1 },
            ingredient: { itemId: itemIds.bars.mithril, amount: 1 }
        }],
        ['adamant', {
            level: 74,
            experience: 62.5,
            item: { itemId: itemIds.swords.adamantite, amount: 1 },
            ingredient: { itemId: itemIds.bars.adamantite, amount: 1 }
        }],
        ['rune', {
            level: 89,
            experience: 75,
            item: { itemId: itemIds.swords.runite, amount: 1 },
            ingredient: { itemId: itemIds.bars.runite, amount: 1 }
        }],
    ])],
    ['dartTips', new Map<string, Smithable>([
        ['bronze', {
            level: 4,
            experience: 12.5,
            item: {
                itemId: itemIds.dartTips.bronze,
                amount: 10
            },
            ingredient: {
                itemId: itemIds.bars.bronze,
                amount: 1
            }
        }],
        ['iron', {
            level: 19,
            experience: 25,
            item: {
                itemId: itemIds.dartTips.iron,
                amount: 10
            },
            ingredient: {
                itemId: itemIds.bars.iron,
                amount: 1
            }
        }],
        ['steel', {
            level: 34,
            experience: 37.5,
            item: {
                itemId: itemIds.dartTips.steel,
                amount: 10
            },
            ingredient: {
                itemId: itemIds.bars.steel,
                amount: 1
            }
        }],
        ['mithril', {
            level: 54,
            experience: 50,
            item: {
                itemId: itemIds.dartTips.mithril,
                amount: 10
            },
            ingredient: {
                itemId: itemIds.bars.mithril,
                amount: 1
            }
        }],
        ['adamant', {
            level: 74,
            experience: 62.5,
            item: {
                itemId: itemIds.dartTips.adamantite,
                amount: 10
            },
            ingredient: {
                itemId: itemIds.bars.adamantite,
                amount: 1
            }
        }],
        ['rune', {
            level: 89,
            experience: 75,
            item: {
                itemId: itemIds.dartTips.runite,
                amount: 10
            },
            ingredient: {
                itemId: itemIds.bars.runite,
                amount: 1
            }
        }],
    ])],
    ['nails', new Map<string, Smithable>([
        ['bronze', {
            level: 4,
            experience: 12.5,
            item: {
                itemId: itemIds.nails.bronze,
                amount: 10
            },
            ingredient: {
                itemId: itemIds.bars.bronze,
                amount: 1
            }
        }],
        ['iron', {
            level: 19,
            experience: 25,
            item: {
                itemId: itemIds.nails.iron,
                amount: 10
            },
            ingredient: {
                itemId: itemIds.bars.iron,
                amount: 1
            }
        }],
        ['steel', {
            level: 34,
            experience: 37.5,
            item: {
                itemId: itemIds.nails.steel,
                amount: 10
            },
            ingredient: {
                itemId: itemIds.bars.steel,
                amount: 1
            }
        }],
        ['mithril', {
            level: 54,
            experience: 50,
            item: {
                itemId: itemIds.nails.mithril,
                amount: 10
            },
            ingredient: {
                itemId: itemIds.bars.mithril,
                amount: 1
            }
        }],
        ['adamant', {
            level: 74,
            experience: 62.5,
            item: {
                itemId: itemIds.nails.adamantite,
                amount: 10
            },
            ingredient: {
                itemId: itemIds.bars.adamantite,
                amount: 1
            }
        }],
        ['rune', {
            level: 89,
            experience: 75,
            item: {
                itemId: itemIds.nails.runite,
                amount: 10
            },
            ingredient: {
                itemId: itemIds.bars.runite,
                amount: 1
            }
        }],
    ])],
    ['scimitar', new Map<string, Smithable>([
        ['bronze', {
            level: 5,
            experience: 25,
            item: {
                itemId: itemIds.scimitars.bronze,
                amount: 1
            },
            ingredient: {
                itemId: itemIds.bars.bronze,
                amount: 2
            }
        }],
        ['iron', {
            level: 20,
            experience: 50,
            item: {
                itemId: itemIds.scimitars.iron,
                amount: 1
            },
            ingredient: {
                itemId: itemIds.bars.iron,
                amount: 2
            }
        }],
        ['steel', {
            level: 35,
            experience: 75,
            item: {
                itemId: itemIds.scimitars.steel,
                amount: 1
            },
            ingredient: {
                itemId: itemIds.bars.steel,
                amount: 2
            }
        }],
        ['mithril', {
            level: 55,
            experience: 100,
            item: {
                itemId: itemIds.scimitars.mithril,
                amount: 1
            },
            ingredient: {
                itemId: itemIds.bars.mithril,
                amount: 2
            }
        }],
        ['adamant', {
            level: 75,
            experience: 125,
            item: {
                itemId: itemIds.scimitars.adamantite,
                amount: 1
            },
            ingredient: {
                itemId: itemIds.bars.adamantite,
                amount: 2
            }
        }],
        ['rune', {
            level: 90,
            experience: 150,
            item: {
                itemId: itemIds.scimitars.runite,
                amount: 1
            },
            ingredient: {
                itemId: itemIds.bars.runite,
                amount: 2
            }
        }],
    ])],
    ['spear', new Map<string, Smithable>([
        ['bronze', {
            level: 5,
            experience: 25,
            item: {
                itemId: itemIds.spears.bronze,
                amount: 1
            },
            ingredient: {
                itemId: itemIds.bars.bronze,
                amount: 1
            }
        }],
        ['iron', {
            level: 20,
            experience: 25,
            item: {
                itemId: itemIds.spears.iron,
                amount: 1
            },
            ingredient: {
                itemId: itemIds.bars.iron,
                amount: 1
            }
        }],
        ['steel', {
            level: 35,
            experience: 37.5,
            item: {
                itemId: itemIds.spears.steel,
                amount: 1
            },
            ingredient: {
                itemId: itemIds.bars.steel,
                amount: 1
            }
        }],
        ['mithril', {
            level: 55,
            experience: 50,
            item: {
                itemId: itemIds.spears.mithril,
                amount: 1
            },
            ingredient: {
                itemId: itemIds.bars.mithril,
                amount: 1
            }
        }],
        ['adamant', {
            level: 75,
            experience: 62.5,
            item: {
                itemId: itemIds.spears.adamantite,
                amount: 1
            },
            ingredient: {
                itemId: itemIds.bars.adamantite,
                amount: 1
            }
        }],
        ['rune', {
            level: 90,
            experience: 75,
            item: {
                itemId: itemIds.spears.runite,
                amount: 1
            },
            ingredient: {
                itemId: itemIds.bars.runite,
                amount: 1
            }
        }],
    ])],
    ['arrowTips', new Map<string, Smithable>([
        ['bronze', {
            level: 5,
            experience: 12.5,
            item: {
                itemId: itemIds.arrowTips.bronze,
                amount: 15
            },
            ingredient: {
                itemId: itemIds.bars.bronze,
                amount: 1
            }
        }],
        ['iron', {
            level: 20,
            experience: 25,
            item: {
                itemId: itemIds.arrowTips.iron,
                amount: 15
            },
            ingredient: {
                itemId: itemIds.bars.iron,
                amount: 1
            }
        }],
        ['steel', {
            level: 35,
            experience: 37.5,
            item: {
                itemId: itemIds.arrowTips.steel,
                amount: 15
            },
            ingredient: {
                itemId: itemIds.bars.steel,
                amount: 1
            }
        }],
        ['mithril', {
            level: 55,
            experience: 50,
            item: {
                itemId: itemIds.arrowTips.mithril,
                amount: 15
            },
            ingredient: {
                itemId: itemIds.bars.mithril,
                amount: 1
            }
        }],
        ['adamant', {
            level: 75,
            experience: 62.5,
            item: {
                itemId: itemIds.arrowTips.adamantite,
                amount: 15
            },
            ingredient: {
                itemId: itemIds.bars.adamantite,
                amount: 1
            }
        }],
        ['rune', {
            level: 90,
            experience: 75,
            item: {
                itemId: itemIds.arrowTips.runite,
                amount: 15
            },
            ingredient: {
                itemId: itemIds.bars.runite,
                amount: 1
            }
        }],
    ])],
    ['limbs', new Map < string, Smithable > ([
        ['bronze', {
            level: 6,
            experience: 12.5,
            item: {
                itemId: itemIds.limbs.bronze,
                amount: 1
            },
            ingredient: {
                itemId: itemIds.bars.bronze,
                amount: 1
            }
        }],
        ['iron', {
            level: 23,
            experience: 25,
            item: {
                itemId: itemIds.limbs.iron,
                amount: 1
            },
            ingredient: {
                itemId: itemIds.bars.iron,
                amount: 1
            }
        }],
        ['steel', {
            level: 36,
            experience: 37.5,
            item: {
                itemId: itemIds.limbs.steel,
                amount: 1
            },
            ingredient: {
                itemId: itemIds.bars.steel,
                amount: 1
            }
        }],
        ['mithril', {
            level: 56,
            experience: 50,
            item: {
                itemId: itemIds.limbs.mithril,
                amount: 1
            },
            ingredient: {
                itemId: itemIds.bars.mithril,
                amount: 1
            }
        }],
        ['adamant', {
            level: 76,
            experience: 62.5,
            item: {
                itemId: itemIds.limbs.adamantite,
                amount: 1
            },
            ingredient: {
                itemId: itemIds.bars.adamantite,
                amount: 1
            }
        }],
        ['rune', {
            level: 91,
            experience: 75,
            item: {
                itemId: itemIds.limbs.runite,
                amount: 1
            },
            ingredient: {
                itemId: itemIds.bars.runite,
                amount: 1
            }
        }],
    ])],
    ['longsword', new Map < string, Smithable > ([
        ['bronze', {
            level: 6,
            experience: 25,
            item: {
                itemId: itemIds.longswords.bronze,
                amount: 1
            },
            ingredient: {
                itemId: itemIds.bars.bronze,
                amount: 2
            }
        }],
        ['iron', {
            level: 21,
            experience: 50,
            item: {
                itemId: itemIds.longswords.iron,
                amount: 1
            },
            ingredient: {
                itemId: itemIds.bars.iron,
                amount: 2
            }
        }],
        ['steel', {
            level: 36,
            experience: 75,
            item: {
                itemId: itemIds.longswords.steel,
                amount: 1
            },
            ingredient: {
                itemId: itemIds.bars.steel,
                amount: 2
            }
        }],
        ['mithril', {
            level: 56,
            experience: 100,
            item: {
                itemId: itemIds.longswords.mithril,
                amount: 1
            },
            ingredient: {
                itemId: itemIds.bars.mithril,
                amount: 2
            }
        }],
        ['adamant', {
            level: 76,
            experience: 125,
            item: {
                itemId: itemIds.longswords.adamantite,
                amount: 1
            },
            ingredient: {
                itemId: itemIds.bars.adamantite,
                amount: 2
            }
        }],
        ['rune', {
            level: 91,
            experience: 150,
            item: {
                itemId: itemIds.longswords.runite,
                amount: 1
            },
            ingredient: {
                itemId: itemIds.bars.runite,
                amount: 2
            }
        }],
    ])],
    ['fullHelm', new Map < string, Smithable > ([
        ['bronze', {
            level: 7,
            experience: 25,
            item: {
                itemId: itemIds.fullHelmets.bronze,
                amount: 1
            },
            ingredient: {
                itemId: itemIds.bars.bronze,
                amount: 2
            }
        }],
        ['iron', {
            level: 22,
            experience: 50,
            item: {
                itemId: itemIds.fullHelmets.iron,
                amount: 1
            },
            ingredient: {
                itemId: itemIds.bars.iron,
                amount: 2
            }
        }],
        ['steel', {
            level: 37,
            experience: 75,
            item: {
                itemId: itemIds.fullHelmets.steel,
                amount: 1
            },
            ingredient: {
                itemId: itemIds.bars.steel,
                amount: 2
            }
        }],
        ['mithril', {
            level: 57,
            experience: 100,
            item: {
                itemId: itemIds.fullHelmets.mithril,
                amount: 1
            },
            ingredient: {
                itemId: itemIds.bars.mithril,
                amount: 2
            }
        }],
        ['adamant', {
            level: 77,
            experience: 125,
            item: {
                itemId: itemIds.fullHelmets.adamantite,
                amount: 1
            },
            ingredient: {
                itemId: itemIds.bars.adamantite,
                amount: 2
            }
        }],
        ['rune', {
            level: 92,
            experience: 150,
            item: {
                itemId: itemIds.fullHelmets.runite,
                amount: 1
            },
            ingredient: {
                itemId: itemIds.bars.runite,
                amount: 2
            }
        }],
    ])],
    ['knife', new Map < string, Smithable > ([
        ['steel', {
            level: 37,
            experience: 37.5,
            item: {
                itemId: itemIds.throwingKnives.steel,
                amount: 5
            },
            ingredient: {
                itemId: itemIds.bars.steel,
                amount: 1
            }
        }],
        ['mithril', {
            level: 57,
            experience: 50,
            item: {
                itemId: itemIds.throwingKnives.mithril,
                amount: 5
            },
            ingredient: {
                itemId: itemIds.bars.mithril,
                amount: 1
            }
        }],
        ['adamant', {
            level: 77,
            experience: 62.5,
            item: {
                itemId: itemIds.throwingKnives.adamantite,
                amount: 5
            },
            ingredient: {
                itemId: itemIds.bars.adamantite,
                amount: 1
            }
        }],
        ['rune', {
            level: 92,
            experience: 75,
            item: {
                itemId: itemIds.throwingKnives.runite,
                amount: 5
            },
            ingredient: {
                itemId: itemIds.bars.runite,
                amount: 1
            }
        }],
    ])],
    ['squareShield', new Map < string, Smithable > ([
        ['bronze', {
            level: 8,
            experience: 25,
            item: {
                itemId: itemIds.squareShields.bronze,
                amount: 1
            },
            ingredient: {
                itemId: itemIds.bars.bronze,
                amount: 2
            }
        }],
        ['iron', {
            level: 23,
            experience: 50,
            item: {
                itemId: itemIds.squareShields.iron,
                amount: 1
            },
            ingredient: {
                itemId: itemIds.bars.iron,
                amount: 2
            }
        }],
        ['steel', {
            level: 38,
            experience: 75,
            item: {
                itemId: itemIds.squareShields.steel,
                amount: 1
            },
            ingredient: {
                itemId: itemIds.bars.steel,
                amount: 2
            }
        }],
        ['mithril', {
            level: 58,
            experience: 100,
            item: {
                itemId: itemIds.squareShields.mithril,
                amount: 1
            },
            ingredient: {
                itemId: itemIds.bars.mithril,
                amount: 2
            }
        }],
        ['adamant', {
            level: 78,
            experience: 125,
            item: {
                itemId: itemIds.squareShields.adamantite,
                amount: 1
            },
            ingredient: {
                itemId: itemIds.bars.adamantite,
                amount: 2
            }
        }],
        ['rune', {
            level: 93,
            experience: 150,
            item: {
                itemId: itemIds.squareShields.runite,
                amount: 1
            },
            ingredient: {
                itemId: itemIds.bars.runite,
                amount: 2
            }
        }],
    ])],
    ['warhammer', new Map < string, Smithable > ([
        ['bronze', {
            level: 9,
            experience: 37.5,
            item: {
                itemId: itemIds.warhammers.bronze,
                amount: 1
            },
            ingredient: {
                itemId: itemIds.bars.bronze,
                amount: 3
            }
        }],
        ['iron', {
            level: 24,
            experience: 75,
            item: {
                itemId: itemIds.warhammers.iron,
                amount: 1
            },
            ingredient: {
                itemId: itemIds.bars.iron,
                amount: 3
            }
        }],
        ['steel', {
            level: 39,
            experience: 112.5,
            item: {
                itemId: itemIds.warhammers.steel,
                amount: 1
            },
            ingredient: {
                itemId: itemIds.bars.steel,
                amount: 3
            }
        }],
        ['mithril', {
            level: 59,
            experience: 150,
            item: {
                itemId: itemIds.warhammers.mithril,
                amount: 1
            },
            ingredient: {
                itemId: itemIds.bars.mithril,
                amount: 3
            }
        }],
        ['adamant', {
            level: 79,
            experience: 187.5,
            item: {
                itemId: itemIds.warhammers.adamantite,
                amount: 1
            },
            ingredient: {
                itemId: itemIds.bars.adamantite,
                amount: 3
            }
        }],
        ['rune', {
            level: 94,
            experience: 225,
            item: {
                itemId: itemIds.warhammers.runite,
                amount: 1
            },
            ingredient: {
                itemId: itemIds.bars.runite,
                amount: 3
            }
        }],
    ])],
    ['battleaxe', new Map < string, Smithable > ([
        ['bronze', {
            level: 9,
            experience: 37.5,
            item: {
                itemId: itemIds.battleAxes.bronze,
                amount: 1
            },
            ingredient: {
                itemId: itemIds.bars.bronze,
                amount: 3
            }
        }],
        ['iron', {
            level: 24,
            experience: 75,
            item: {
                itemId: itemIds.battleAxes.iron,
                amount: 1
            },
            ingredient: {
                itemId: itemIds.bars.iron,
                amount: 3
            }
        }],
        ['steel', {
            level: 39,
            experience: 112.5,
            item: {
                itemId: itemIds.battleAxes.steel,
                amount: 1
            },
            ingredient: {
                itemId: itemIds.bars.steel,
                amount: 3
            }
        }],
        ['mithril', {
            level: 59,
            experience: 150,
            item: {
                itemId: itemIds.battleAxes.mithril,
                amount: 1
            },
            ingredient: {
                itemId: itemIds.bars.mithril,
                amount: 3
            }
        }],
        ['adamant', {
            level: 79,
            experience: 187.5,
            item: {
                itemId: itemIds.battleAxes.adamantite,
                amount: 1
            },
            ingredient: {
                itemId: itemIds.bars.adamantite,
                amount: 3
            }
        }],
        ['rune', {
            level: 94,
            experience: 225,
            item: {
                itemId: itemIds.battleAxes.runite,
                amount: 1
            },
            ingredient: {
                itemId: itemIds.bars.runite,
                amount: 3
            }
        }],
    ])],
    ['chainbody', new Map < string, Smithable > ([
        ['bronze', {
            level: 11,
            experience: 37.5,
            item: {
                itemId: itemIds.chainbodies.bronze,
                amount: 1
            },
            ingredient: {
                itemId: itemIds.bars.bronze,
                amount: 3
            }
        }],
        ['iron', {
            level: 26,
            experience: 75,
            item: {
                itemId: itemIds.chainbodies.iron,
                amount: 1
            },
            ingredient: {
                itemId: itemIds.bars.iron,
                amount: 3
            }
        }],
        ['steel', {
            level: 41,
            experience: 112.5,
            item: {
                itemId: itemIds.chainbodies.steel,
                amount: 1
            },
            ingredient: {
                itemId: itemIds.bars.steel,
                amount: 3
            }
        }],
        ['mithril', {
            level: 61,
            experience: 150,
            item: {
                itemId: itemIds.chainbodies.mithril,
                amount: 1
            },
            ingredient: {
                itemId: itemIds.bars.mithril,
                amount: 3
            }
        }],
        ['adamant', {
            level: 81,
            experience: 187.5,
            item: {
                itemId: itemIds.chainbodies.adamantite,
                amount: 1
            },
            ingredient: {
                itemId: itemIds.bars.adamantite,
                amount: 3
            }
        }],
        ['rune', {
            level: 96,
            experience: 225,
            item: {
                itemId: itemIds.chainbodies.runite,
                amount: 1
            },
            ingredient: {
                itemId: itemIds.bars.runite,
                amount: 3
            }
        }],
    ])],
    ['kiteshield', new Map<string, Smithable>([
        ['bronze', {
            level: 12,
            experience: 37.5,
            item: {
                itemId: itemIds.kiteshields.bronze,
                amount: 1
            },
            ingredient: {
                itemId: itemIds.bars.bronze,
                amount: 3
            }
        }],
        ['iron', {
            level: 27,
            experience: 75,
            item: {
                itemId: itemIds.kiteshields.iron,
                amount: 1
            },
            ingredient: {
                itemId: itemIds.bars.iron,
                amount: 3
            }
        }],
        ['steel', {
            level: 42,
            experience: 112.5,
            item: {
                itemId: itemIds.kiteshields.steel,
                amount: 1
            },
            ingredient: {
                itemId: itemIds.bars.steel,
                amount: 3
            }
        }],
        ['mithril', {
            level: 62,
            experience: 150,
            item: {
                itemId: itemIds.kiteshields.mithril,
                amount: 1
            },
            ingredient: {
                itemId: itemIds.bars.mithril,
                amount: 3
            }
        }],
        ['adamant', {
            level: 82,
            experience: 187.5,
            item: {
                itemId: itemIds.kiteshields.adamantite,
                amount: 1
            },
            ingredient: {
                itemId: itemIds.bars.adamantite,
                amount: 3
            }
        }],
        ['rune', {
            level: 97,
            experience: 225,
            item: {
                itemId: itemIds.kiteshields.runite,
                amount: 1
            },
            ingredient: {
                itemId: itemIds.bars.runite,
                amount: 3
            }
        }],
    ])],
    ['claws', new Map < string, Smithable > ([
        ['bronze', {
            level: 13,
            experience: 25,
            item: {
                itemId: itemIds.claws.bronze,
                amount: 1
            },
            ingredient: {
                itemId: itemIds.bars.bronze,
                amount: 2
            }
        }],
        ['iron', {
            level: 28,
            experience: 50,
            item: {
                itemId: itemIds.claws.iron,
                amount: 1
            },
            ingredient: {
                itemId: itemIds.bars.iron,
                amount: 2
            }
        }],
        ['steel', {
            level: 43,
            experience: 75,
            item: {
                itemId: itemIds.claws.steel,
                amount: 1
            },
            ingredient: {
                itemId: itemIds.bars.steel,
                amount: 2
            }
        }],
        ['mithril', {
            level: 63,
            experience: 100,
            item: {
                itemId: itemIds.claws.mithril,
                amount: 1
            },
            ingredient: {
                itemId: itemIds.bars.mithril,
                amount: 2
            }
        }],
        ['adamant', {
            level: 83,
            experience: 125,
            item: {
                itemId: itemIds.claws.adamantite,
                amount: 1
            },
            ingredient: {
                itemId: itemIds.bars.adamantite,
                amount: 2
            }
        }],
        ['rune', {
            level: 98,
            experience: 150,
            item: {
                itemId: itemIds.claws.runite,
                amount: 1
            },
            ingredient: {
                itemId: itemIds.bars.runite,
                amount: 2
            }
        }],
    ])],
    ['twoHandedSword', new Map < string, Smithable > ([
        ['bronze', {
            level: 14,
            experience: 37.5,
            item: {
                itemId: itemIds.twoHandSwords.bronze,
                amount: 1
            },
            ingredient: {
                itemId: itemIds.bars.bronze,
                amount: 3
            }
        }],
        ['iron', {
            level: 29,
            experience: 75,
            item: {
                itemId: itemIds.twoHandSwords.iron,
                amount: 1
            },
            ingredient: {
                itemId: itemIds.bars.iron,
                amount: 3
            }
        }],
        ['steel', {
            level: 44,
            experience: 112.5,
            item: {
                itemId: itemIds.twoHandSwords.steel,
                amount: 1
            },
            ingredient: {
                itemId: itemIds.bars.steel,
                amount: 3
            }
        }],
        ['mithril', {
            level: 64,
            experience: 150,
            item: {
                itemId: itemIds.twoHandSwords.mithril,
                amount: 1
            },
            ingredient: {
                itemId: itemIds.bars.mithril,
                amount: 3
            }
        }],
        ['adamant', {
            level: 84,
            experience: 187.5,
            item: {
                itemId: itemIds.twoHandSwords.adamantite,
                amount: 1
            },
            ingredient: {
                itemId: itemIds.bars.adamantite,
                amount: 3
            }
        }],
        ['rune', {
            level: 99,
            experience: 225,
            item: {
                itemId: itemIds.twoHandSwords.runite,
                amount: 1
            },
            ingredient: {
                itemId: itemIds.bars.runite,
                amount: 3
            }
        }],
    ])],
    ['platelegs', new Map<string, Smithable>([
        ['bronze', {
            level: 16,
            experience: 37.5,
            item: {
                itemId: itemIds.platelegs.bronze,
                amount: 1
            },
            ingredient: {
                itemId: itemIds.bars.bronze,
                amount: 3
            }
        }],
        ['iron', {
            level: 31,
            experience: 75,
            item: {
                itemId: itemIds.platelegs.iron,
                amount: 1
            },
            ingredient: {
                itemId: itemIds.bars.iron,
                amount: 3
            }
        }],
        ['steel', {
            level: 46,
            experience: 112.5,
            item: {
                itemId: itemIds.platelegs.steel,
                amount: 1
            },
            ingredient: {
                itemId: itemIds.bars.steel,
                amount: 3
            }
        }],
        ['mithril', {
            level: 66,
            experience: 150,
            item: {
                itemId: itemIds.platelegs.mithril,
                amount: 1
            },
            ingredient: {
                itemId: itemIds.bars.mithril,
                amount: 3
            }
        }],
        ['adamant', {
            level: 86,
            experience: 187.5,
            item: {
                itemId: itemIds.platelegs.adamantite,
                amount: 1
            },
            ingredient: {
                itemId: itemIds.bars.adamantite,
                amount: 3
            }
        }],
        ['rune', {
            level: 99,
            experience: 225,
            item: {
                itemId: itemIds.platelegs.runite,
                amount: 1
            },
            ingredient: {
                itemId: itemIds.bars.runite,
                amount: 3
            }
        }],
    ])],
    ['plateskirt', new Map < string, Smithable > ([
        ['bronze', {
            level: 16,
            experience: 37.5,
            item: {
                itemId: itemIds.plateskirts.bronze,
                amount: 1
            },
            ingredient: {
                itemId: itemIds.bars.bronze,
                amount: 3
            }
        }],
        ['iron', {
            level: 31,
            experience: 75,
            item: {
                itemId: itemIds.plateskirts.iron,
                amount: 1
            },
            ingredient: {
                itemId: itemIds.bars.iron,
                amount: 3
            }
        }],
        ['steel', {
            level: 46,
            experience: 112.5,
            item: {
                itemId: itemIds.plateskirts.steel,
                amount: 1
            },
            ingredient: {
                itemId: itemIds.bars.steel,
                amount: 3
            }
        }],
        ['mithril', {
            level: 66,
            experience: 150,
            item: {
                itemId: itemIds.plateskirts.mithril,
                amount: 1
            },
            ingredient: {
                itemId: itemIds.bars.mithril,
                amount: 3
            }
        }],
        ['adamant', {
            level: 86,
            experience: 187.5,
            item: {
                itemId: itemIds.plateskirts.adamantite,
                amount: 1
            },
            ingredient: {
                itemId: itemIds.bars.adamantite,
                amount: 3
            }
        }],
        ['rune', {
            level: 99,
            experience: 225,
            item: {
                itemId: itemIds.plateskirts.runite,
                amount: 1
            },
            ingredient: {
                itemId: itemIds.bars.runite,
                amount: 3
            }
        }],
    ])],
    ['platebody', new Map<string, Smithable>([
        ['bronze', {
            level: 16,
            experience: 37.5,
            item: {
                itemId: itemIds.platebodys.bronze,
                amount: 1
            },
            ingredient: {
                itemId: itemIds.bars.bronze,
                amount: 5
            }
        }],
        ['iron', {
            level: 31,
            experience: 75,
            item: {
                itemId: itemIds.platebodys.iron,
                amount: 1
            },
            ingredient: {
                itemId: itemIds.bars.iron,
                amount: 5
            }
        }],
        ['steel', {
            level: 46,
            experience: 112.5,
            item: {
                itemId: itemIds.platebodys.steel,
                amount: 1
            },
            ingredient: {
                itemId: itemIds.bars.steel,
                amount: 5
            }
        }],
        ['mithril', {
            level: 66,
            experience: 150,
            item: {
                itemId: itemIds.platebodys.mithril,
                amount: 1
            },
            ingredient: {
                itemId: itemIds.bars.mithril,
                amount: 5
            }
        }],
        ['adamant', {
            level: 86,
            experience: 187.5,
            item: {
                itemId: itemIds.platebodys.adamantite,
                amount: 1
            },
            ingredient: {
                itemId: itemIds.bars.adamantite,
                amount: 5
            }
        }],
        ['rune', {
            level: 99,
            experience: 225,
            item: {
                itemId: itemIds.platebodys.runite,
                amount: 1
            },
            ingredient: {
                itemId: itemIds.bars.runite,
                amount: 5
            }
        }],
    ])],
    ['unknown', new Map < string, Smithable > ([
        ['any', {
            level: 1,
            experience: 0,
            item: {
                itemId: -1,
                amount: -1
            },
            ingredient: {
                itemId: itemIds.bars.bronze,
                amount: 1
            }
        }]
    ])],
]);

export const widgetItems : Map<number, Map<number, Smithable[]>> = new Map<number, Map<number, Smithable[]>>([
    [itemIds.bars.bronze, new Map<number, Smithable[]>([
        [146, [ // Dagger, Sword, Scimitar, Longsword, 2h sword
            smithables.get('dagger').get('bronze'),
            smithables.get('sword').get('bronze'),
            smithables.get('scimitar').get('bronze'),
            smithables.get('longsword').get('bronze'),
            smithables.get('twoHandedSword').get('bronze'),
        ]],
        [147, [ // Axe, Mace, Warhammer, Battleaxe, Claws
            smithables.get('axe').get('bronze'),
            smithables.get('mace').get('bronze'),
            smithables.get('warhammer').get('bronze'),
            smithables.get('battleaxe').get('bronze'),
            smithables.get('claws').get('bronze')
        ]],
        [148, [ // Chainbody, Platelegs, Plateskirt, Platebody, *Lantern*
            smithables.get('chainbody').get('bronze'),
            smithables.get('platelegs').get('bronze'),
            smithables.get('plateskirt').get('bronze'),
            smithables.get('platebody').get('bronze'),
            smithables.get('unknown').get('any')
        ]],
        [149, [ // Medium helm, Full helm, Sq shield, kite shield, Nails
            smithables.get('mediumHelm').get('bronze'),
            smithables.get('fullHelm').get('bronze'),
            smithables.get('squareShield').get('bronze'),
            smithables.get('kiteshield').get('bronze'),
            smithables.get('nails').get('bronze')
        ]],
        [150, [ // Dart tip, Arrowtips, Throwing knives, *Other*, *Studs*
            smithables.get('dartTips').get('bronze'),
            smithables.get('arrowTips').get('bronze'),
            smithables.get('unknown').get('any'),
            smithables.get('unknown').get('any'),
            smithables.get('unknown').get('any')
        ]],
        [151, [ // Bolts, Limbs, Grapple tips
            smithables.get('bolts').get('bronze'),
            smithables.get('limbs').get('bronze'),
            smithables.get('unknown').get('any'),
        ]]
    ])],
    [itemIds.bars.iron, new Map<number, Smithable[]>([
        [146, [ // Dagger, Sword, Scimitar, Longsword, 2h sword
            smithables.get('dagger').get('iron'),
            smithables.get('sword').get('iron'),
            smithables.get('scimitar').get('iron'),
            smithables.get('longsword').get('iron'),
            smithables.get('twoHandedSword').get('iron'),
        ]],
        [147, [ // Axe, Mace, Warhammer, Battleaxe, Claws
            smithables.get('axe').get('iron'),
            smithables.get('mace').get('iron'),
            smithables.get('warhammer').get('iron'),
            smithables.get('battleaxe').get('iron'),
            smithables.get('claws').get('iron')
        ]],
        [148, [ // Chainbody, Platelegs, Plateskirt, Platebody, *Lantern*
            smithables.get('chainbody').get('iron'),
            smithables.get('platelegs').get('iron'),
            smithables.get('plateskirt').get('iron'),
            smithables.get('platebody').get('iron'),
            smithables.get('unknown').get('any')
        ]],
        [149, [ // Medium helm, Full helm, Sq shield, kite shield, Nails
            smithables.get('mediumHelm').get('iron'),
            smithables.get('fullHelm').get('iron'),
            smithables.get('squareShield').get('iron'),
            smithables.get('kiteshield').get('iron'),
            smithables.get('nails').get('iron')
        ]],
        [150, [ // Dart tip, Arrowtips, Throwing knives, *Other*, *Studs*
            smithables.get('dartTips').get('iron'),
            smithables.get('arrowTips').get('iron'),
            smithables.get('unknown').get('any'),
            smithables.get('unknown').get('any'),
            smithables.get('unknown').get('any')
        ]],
        [151, [ // Bolts, Limbs, Grapple tips
            smithables.get('bolts').get('iron'),
            smithables.get('limbs').get('iron'),
            smithables.get('unknown').get('any'),
        ]]
    ])],
    [itemIds.bars.steel, new Map<number, Smithable[]>([
        [146, [ // Dagger, Sword, Scimitar, Longsword, 2h sword
            smithables.get('dagger').get('steel'),
            smithables.get('sword').get('steel'),
            smithables.get('scimitar').get('steel'),
            smithables.get('longsword').get('steel'),
            smithables.get('twoHandedSword').get('steel'),
        ]],
        [147, [ // Axe, Mace, Warhammer, Battleaxe, Claws
            smithables.get('axe').get('steel'),
            smithables.get('mace').get('steel'),
            smithables.get('warhammer').get('steel'),
            smithables.get('battleaxe').get('steel'),
            smithables.get('claws').get('steel')
        ]],
        [148, [ // Chainbody, Platelegs, Plateskirt, Platebody, *Lantern*
            smithables.get('chainbody').get('steel'),
            smithables.get('platelegs').get('steel'),
            smithables.get('plateskirt').get('steel'),
            smithables.get('platebody').get('steel'),
            smithables.get('unknown').get('any')
        ]],
        [149, [ // Medium helm, Full helm, Sq shield, kite shield, Nails
            smithables.get('mediumHelm').get('steel'),
            smithables.get('fullHelm').get('steel'),
            smithables.get('squareShield').get('steel'),
            smithables.get('kiteshield').get('steel'),
            smithables.get('nails').get('steel')
        ]],
        [150, [ // Dart tip, Arrowtips, Throwing knives, *Other*, *Studs*
            smithables.get('dartTips').get('steel'),
            smithables.get('arrowTips').get('steel'),
            smithables.get('knife').get('steel'),
            smithables.get('unknown').get('any'),
            smithables.get('unknown').get('any')
        ]],
        [151, [ // Bolts, Limbs, Grapple tips
            smithables.get('bolts').get('steel'),
            smithables.get('limbs').get('steel'),
            smithables.get('unknown').get('any'),
        ]]
    ])],
    [itemIds.bars.mithril, new Map<number, Smithable[]>([
        [146, [ // Dagger, Sword, Scimitar, Longsword, 2h sword
            smithables.get('dagger').get('mithril'),
            smithables.get('sword').get('mithril'),
            smithables.get('scimitar').get('mithril'),
            smithables.get('longsword').get('mithril'),
            smithables.get('twoHandedSword').get('mithril'),
        ]],
        [147, [ // Axe, Mace, Warhammer, Battleaxe, Claws
            smithables.get('axe').get('mithril'),
            smithables.get('mace').get('mithril'),
            smithables.get('warhammer').get('mithril'),
            smithables.get('battleaxe').get('mithril'),
            smithables.get('claws').get('mithril')
        ]],
        [148, [ // Chainbody, Platelegs, Plateskirt, Platebody, *Lantern*
            smithables.get('chainbody').get('mithril'),
            smithables.get('platelegs').get('mithril'),
            smithables.get('plateskirt').get('mithril'),
            smithables.get('platebody').get('mithril'),
            smithables.get('unknown').get('any')
        ]],
        [149, [ // Medium helm, Full helm, Sq shield, kite shield, Nails
            smithables.get('mediumHelm').get('mithril'),
            smithables.get('fullHelm').get('mithril'),
            smithables.get('squareShield').get('mithril'),
            smithables.get('kiteshield').get('mithril'),
            smithables.get('nails').get('mithril')
        ]],
        [150, [ // Dart tip, Arrowtips, Throwing knives, *Other*, *Studs*
            smithables.get('dartTips').get('mithril'),
            smithables.get('arrowTips').get('mithril'),
            smithables.get('knife').get('mithril'),
            smithables.get('unknown').get('any'),
            smithables.get('unknown').get('any')
        ]],
        [151, [ // Bolts, Limbs, Grapple tips
            smithables.get('bolts').get('mithril'),
            smithables.get('limbs').get('mithril'),
            smithables.get('unknown').get('any'),
        ]]
    ])],
    [itemIds.bars.adamantite, new Map<number, Smithable[]>([
        [146, [ // Dagger, Sword, Scimitar, Longsword, 2h sword
            smithables.get('dagger').get('adamant'),
            smithables.get('sword').get('adamant'),
            smithables.get('scimitar').get('adamant'),
            smithables.get('longsword').get('adamant'),
            smithables.get('twoHandedSword').get('adamant'),
        ]],
        [147, [ // Axe, Mace, Warhammer, Battleaxe, Claws
            smithables.get('axe').get('adamant'),
            smithables.get('mace').get('adamant'),
            smithables.get('warhammer').get('adamant'),
            smithables.get('battleaxe').get('adamant'),
            smithables.get('claws').get('adamant')
        ]],
        [148, [ // Chainbody, Platelegs, Plateskirt, Platebody, *Lantern*
            smithables.get('chainbody').get('adamant'),
            smithables.get('platelegs').get('adamant'),
            smithables.get('plateskirt').get('adamant'),
            smithables.get('platebody').get('adamant'),
            smithables.get('unknown').get('any')
        ]],
        [149, [ // Medium helm, Full helm, Sq shield, kite shield, Nails
            smithables.get('mediumHelm').get('adamant'),
            smithables.get('fullHelm').get('adamant'),
            smithables.get('squareShield').get('adamant'),
            smithables.get('kiteshield').get('adamant'),
            smithables.get('nails').get('adamant')
        ]],
        [150, [ // Dart tip, Arrowtips, Throwing knives, *Other*, *Studs*
            smithables.get('dartTips').get('adamant'),
            smithables.get('arrowTips').get('adamant'),
            smithables.get('knife').get('adamant'),
            smithables.get('unknown').get('any'),
            smithables.get('unknown').get('any')
        ]],
        [151, [ // Bolts, Limbs, Grapple tips
            smithables.get('bolts').get('adamant'),
            smithables.get('limbs').get('adamant'),
            smithables.get('unknown').get('any'),
        ]]
    ])],
    [itemIds.bars.runite, new Map<number, Smithable[]>([
        [146, [ // Dagger, Sword, Scimitar, Longsword, 2h sword
            smithables.get('dagger').get('rune'),
            smithables.get('sword').get('rune'),
            smithables.get('scimitar').get('rune'),
            smithables.get('longsword').get('rune'),
            smithables.get('twoHandedSword').get('rune'),
        ]],
        [147, [ // Axe, Mace, Warhammer, Battleaxe, Claws
            smithables.get('axe').get('rune'),
            smithables.get('mace').get('rune'),
            smithables.get('warhammer').get('rune'),
            smithables.get('battleaxe').get('rune'),
            smithables.get('claws').get('rune')
        ]],
        [148, [ // Chainbody, Platelegs, Plateskirt, Platebody, *Lantern*
            smithables.get('chainbody').get('rune'),
            smithables.get('platelegs').get('rune'),
            smithables.get('plateskirt').get('rune'),
            smithables.get('platebody').get('rune'),
            smithables.get('unknown').get('any')
        ]],
        [149, [ // Medium helm, Full helm, Sq shield, kite shield, Nails
            smithables.get('mediumHelm').get('rune'),
            smithables.get('fullHelm').get('rune'),
            smithables.get('squareShield').get('rune'),
            smithables.get('kiteshield').get('rune'),
            smithables.get('nails').get('rune')
        ]],
        [150, [ // Dart tip, Arrowtips, Throwing knives, *Other*, *Studs*
            smithables.get('dartTips').get('rune'),
            smithables.get('arrowTips').get('rune'),
            smithables.get('knife').get('rune'),
            smithables.get('unknown').get('any'),
            smithables.get('unknown').get('any')
        ]],
        [151, [ // Bolts, Limbs, Grapple tips
            smithables.get('bolts').get('rune'),
            smithables.get('limbs').get('rune'),
            smithables.get('unknown').get('any'),
        ]]
    ])]
]);
