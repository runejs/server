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

export function rollGemRockResult(): Item  {
    const roll = randomBetween(0, 127);
    let itemId;
    if (roll < 60) {
        itemId = 1625; // Uncut Opal
    } else if (roll < 90) {
        itemId = 1627; // Uncut Jade
    } else if (roll < 105) {
        itemId = 1629; // uncut topaz
    } else if (roll < 114) {
        itemId = 1623; // uncut sapphire
    } else if (roll < 119) {
        itemId = 1621; // uncut emerald
    } else if (roll < 124) {
        itemId = 1619; // uncut ruby
    } else {
        itemId = 1617; // uncut diamond
    }
    return {itemId: itemId, amount: 1};
}
