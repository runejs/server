// Note if adding hunter, Strung rabbit foot makes this out of 94 instead of 99
import { randomBetween } from '@server/util/num';
import { Item } from '@server/world/items/item';

export function rollBirdsNestType(): Item {
    const roll = randomBetween(0, 99);
    let itemId;
    if (roll > 3) {
        // Bird egg
        if (roll === 0) {
            itemId = 5070; // Red egg
        } else if (roll === 1) {
            itemId = 5071; // Green egg
        } else {
            itemId = 5072; // blue egg
        }
    } else if (roll > 34) {
        itemId = 5074; // Ring
    } else {
        itemId = 5073; // Seeds
    }
    return {itemId: itemId, amount: 1};
}

export function rollGemType(): Item {
    const roll = randomBetween(0, 3);
    let itemId;
    if (roll === 0) {
        itemId = 1617; // Uncut Diamond
    } else if (roll === 1) {
        itemId = 1619; // Uncut ruby
    } else if (roll === 2) {
        itemId = 1621; // uncut emerald
    } else {
        itemId = 1623; // uncut sapphire
    }
    return {itemId: itemId, amount: 1};
}
