import { ActionType, RunePlugin } from '@server/plugins/plugin';
import { objectAction } from '@server/world/actor/player/action/object-action';
import { itemIds } from '@server/world/config/item-ids';
import { Item } from '@server/world/items/item';
import { Position } from '@server/world/position';
import { cache } from '@server/game-server';
import { itemOnObjectAction } from '@server/world/actor/player/action/item-on-object-action';
import { Skill } from '@server/world/actor/skills';
import { widgets } from '@server/world/config/widget';
import { equipAction } from '@server/world/actor/player/action/equip-action';

interface Recipe {
    ingredients: Item[] | number[];
    result: Item | number;
}

interface Pos {
    x: number;
    y: number;
    level: number;
}

interface Tiara {
    id: number;
    config: number;
    recipe: Recipe;
    level: number;
    xp: number;
}

interface Talisman {
    id: number;
}

interface Altar {
    entranceId: number;
    craftingId: number;
    portalId: number;
    entrance: Pos;
    exit: Pos;
}

interface Rune {
    id: number;
    xp: number;
    level: number;
    essence: number[];
    altar: Altar;
    tiara: Tiara;
    talisman: Talisman;
}

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

export const tiaras : Map<string, Tiara> = new Map<string, Tiara>([
    ['air', {id: 5527, config: 1, level: 1, xp: 25.0, recipe: { ingredients: [itemIds.talismans.air, itemIds.tiaras.blank], result: itemIds.tiaras.air}}],
    ['mind', {id: 5529, config: 2, level: 1, xp: 27.5, recipe: { ingredients: [itemIds.talismans.mind, itemIds.tiaras.blank], result: itemIds.tiaras.mind}}],
    ['water', {id: 5531, config: 4, level: 1, xp: 30, recipe: { ingredients: [itemIds.talismans.water, itemIds.tiaras.blank], result: itemIds.tiaras.water}}],
    ['body', {id: 5533, config: 32, level: 1, xp: 37.5, recipe: { ingredients: [itemIds.talismans.body, itemIds.tiaras.blank], result: itemIds.tiaras.body}}],
    ['earth', {id: 5535, config: 8, level: 1, xp: 32.5, recipe: { ingredients: [itemIds.talismans.earth, itemIds.tiaras.blank], result: itemIds.tiaras.earth}}],
    ['fire', {id: 5537, config: 16, level: 1, xp: 35, recipe: { ingredients: [itemIds.talismans.fire, itemIds.tiaras.blank], result: itemIds.tiaras.fire}}],
    ['cosmic', {id: 5539, config: 64, level: 1, xp: 40, recipe: { ingredients: [itemIds.talismans.cosmic, itemIds.tiaras.blank], result: itemIds.talismans.cosmic}}],
    ['nature', {id: 5541, config: 256, level: 1, xp: 45, recipe: { ingredients: [itemIds.talismans.nature, itemIds.tiaras.blank], result: itemIds.talismans.nature}}],
    ['chaos', {id: 5543, config: 128, level: 1, xp: 42.5, recipe: { ingredients: [itemIds.talismans.chaos, itemIds.tiaras.blank], result: itemIds.talismans.chaos}}],
    ['law', {id: 5545, config: 512, level: 1, xp: 47.5, recipe: { ingredients: [itemIds.talismans.law, itemIds.tiaras.blank], result: itemIds.talismans.law}}],
    ['death', {id: 5548, config: 1024, level: 1, xp: 50, recipe: { ingredients: [itemIds.talismans.death, itemIds.tiaras.blank], result: itemIds.talismans.death}}],
]);

export const talismans : Map<string, Talisman> = new Map<string, Talisman>([
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
]);

export const altars : Map<string, Altar> = new Map<string, Altar>([
    ['air', {entranceId: 2452, craftingId: 2478, portalId: 2465, entrance: {x: 2841, y: 4829, level: 0}, exit: {x: 2983, y: 3292, level: 0}}],
    ['mind', {entranceId: 2453, craftingId: 2479, portalId: 2466, entrance: {x: 2793, y: 4828, level: 0}, exit: {x: 2980, y: 3514, level: 0}}],
    ['water', {entranceId: 2454, craftingId: 2480, portalId: 2467, entrance: {x: 2726, y: 4832, level: 0}, exit: {x: 3187, y: 3166, level: 0}}],
    ['earth', {entranceId: 2455, craftingId: 2481, portalId: 2468, entrance: {x: 2655, y: 4830, level: 0}, exit: {x: 3304, y: 3474, level: 0}}],
    ['fire', {entranceId: 2456, craftingId: 2482, portalId: 2469, entrance: {x: 2574, y: 4849, level: 0}, exit: {x: 3311, y: 3256, level: 0}}],
    ['body', {entranceId: 2457, craftingId: 2483, portalId: 2470, entrance: {x: 2524, y: 4825, level: 0}, exit: {x: 3051, y: 3445, level: 0}}],
    ['cosmic', {entranceId: 2458, craftingId: 2484, portalId: 2471, entrance: {x: 2142, y: 4813, level: 0}, exit: {x: 2408, y: 4379, level: 0}}],
    ['law', {entranceId: 2459, craftingId: 2485, portalId: 2472, entrance: {x: 2464, y: 4818, level: 0}, exit: {x: 2858, y: 3379, level: 0}}],
    ['nature', {entranceId: 2460, craftingId: 2486, portalId: 2473, entrance: {x: 2400, y: 4835, level: 0}, exit: {x: 2867, y: 3019, level: 0}}],
    ['chaos', {entranceId: 2461, craftingId: 2487, portalId: 2474, entrance: {x: 2268, y: 4842, level: 0}, exit: {x: 3058, y: 3591, level: 0}}],
    ['death', {entranceId: 2462, craftingId: 2488, portalId: 2475, entrance: {x: 2208, y: 4830, level: 0}, exit: {x: 3222, y: 3222, level: 0}}],
]);

export const runes : Map<string, Rune> = new Map<string, Rune>([
    ['air', {id: 556, xp: 5.0, level: 1, essence: [itemIds.essence.pure, itemIds.essence.rune], altar: altars.get('air'), talisman: talismans.get('air'), tiara: tiaras.get('air')}],
    ['mind', {id: 558, xp: 5.5, level: 1, essence: [itemIds.essence.pure, itemIds.essence.rune], altar: altars.get('mind'), talisman: talismans.get('mind'), tiara: tiaras.get('mind')}],
    ['water', {id: 555, xp: 6, level: 5, essence: [itemIds.essence.pure, itemIds.essence.rune], altar: altars.get('water'), talisman: talismans.get('water'), tiara: tiaras.get('water')}],
    ['earth', {id: 557, xp: 6.5, level: 9, essence: [itemIds.essence.pure, itemIds.essence.rune], altar: altars.get('earth'), talisman: talismans.get('earth'), tiara: tiaras.get('earth')}],
    ['fire', {id: 554, xp: 7.0, level: 14, essence: [itemIds.essence.pure, itemIds.essence.rune], altar: altars.get('fire'), talisman: talismans.get('fire'), tiara: tiaras.get('fire')}],
    ['body', {id: 559, xp: 7.5, level: 20, essence: [itemIds.essence.pure, itemIds.essence.rune], altar: altars.get('body'), talisman: talismans.get('body'), tiara: tiaras.get('body')}],
    ['cosmic', {id: 564, xp: 8.0, level: 27, essence: [itemIds.essence.pure], altar: altars.get('cosmic'), talisman: talismans.get('cosmic'), tiara: tiaras.get('cosmic')}],
    ['chaos', {id: 562, xp: 8.5, level: 35, essence: [itemIds.essence.pure], altar: altars.get('chaos'), talisman: talismans.get('chaos'), tiara: tiaras.get('chaos')}],
    ['nature', {id: 561, xp: 9.0, level: 44, essence: [itemIds.essence.pure], altar: altars.get('nature'), talisman: talismans.get('nature'), tiara: tiaras.get('nature')}],
    ['law', {id: 563, xp: 9.5, level: 54, essence: [itemIds.essence.pure], altar: altars.get('law'), talisman: talismans.get('law'), tiara: tiaras.get('law')}],
    ['death', {id: 560, xp: 10.0, level: 65, essence: [itemIds.essence.pure], altar: altars.get('death'), talisman: talismans.get('death'), tiara: tiaras.get('death')}],
]);


const enterAltar : itemOnObjectAction = (details) => {
    const {player, object, item} = details;
    const altar = getEntityByAttr(altars, 'entranceId', object.objectId);
    const rune = getEntityByAttr(runes, 'altar.entranceId', object.objectId);

    // Wrong talisman.
    if (item.itemId !== rune.talisman.id) {
        player.sendMessage('Nothing interesting happens.');
    }

    // Correct talisman.
    if (item.itemId === rune.talisman.id) {
        const talisman = cache.itemDefinitions.get(rune.talisman.id);
        player.sendMessage(`You hold the ${talisman.name} towards the mysterious ruins.`);
        player.sendMessage(`You feel a powerful force take hold of you..`);
        player.teleport(new Position(altar.entrance.x, altar.entrance.y, altar.entrance.level));
    }
};

const unequipTiara : equipAction = (details) => {
    const { player } = details;
    player.outgoingPackets.updateClientConfig(491, 0);
};

const equipTiara : equipAction = (details) => {
    const { player, itemId } = details;
    const tiara = getEntityByAttr(tiaras, 'id', itemId);
    player.outgoingPackets.updateClientConfig(491, tiara.config);
};

const exitAltar : objectAction = (details) => {
    const {player, object} = details;
    const altar = getEntityByAttr(altars, 'portalId', object.objectId);
    player.teleport(new Position(altar.exit.x, altar.exit.y, altar.exit.level));
};

const craftRune : objectAction = (details) => {
    const {player, object} = details;
    const rune = getEntityByAttr(runes, 'altar.craftingId', object.objectId);
    const level = player.skills.get(Skill.RUNECRAFTING).level;

    let essenceAvailable = 0;
    rune.essence.forEach((essenceId) => {
        essenceAvailable += player.inventory.findAll(essenceId).length;
    });

    if (essenceAvailable > 0) {
        // Remove essence.
        rune.essence.forEach((essenceId) => {
            player.inventory.findAll(essenceId).forEach((index) => {
                player.inventory.remove(index);
            });
        });
        // Add crafted runes
        player.inventory.add({itemId: rune.id, amount: (runeMultiplier(rune.id, level) * essenceAvailable)});
        // Add experience
        player.skills.addExp(Skill.RUNECRAFTING, (rune.xp * essenceAvailable));
        // Update widget items.
        player.outgoingPackets.sendUpdateAllWidgetItems(widgets.inventory, player.inventory);
        return ;
    }

    player.sendMessage(`You do not have any rune essence to bind.`);
};

const runeMultiplier = (runeId: number, level: number) => {
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
};

const getEntityByAttr = (entities, attr, value) => {
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
};

const getEntityIds = (entities, property) => {
    const entityIds : number[] = [];
    entities.forEach((entity) => {
        entityIds.push(entity[property]);
    }); return entityIds;
};

export default new RunePlugin([
    {
        type: ActionType.ITEM_ON_OBJECT_ACTION,
        itemIds: getEntityIds(talismans, 'id'),
        objectIds: getEntityIds(altars, 'entranceId'),
        walkTo: true,
        action: enterAltar
    }, {
        type: ActionType.OBJECT_ACTION,
        objectIds: getEntityIds(altars, 'portalId'),
        walkTo: true,
        action: exitAltar
    }, {
        type: ActionType.OBJECT_ACTION,
        objectIds: getEntityIds(altars, 'craftingId'),
        walkTo: true,
        action: craftRune
    }, {
        type: ActionType.EQUIP_ACTION,
        equipType: 'EQUIP',
        itemIds: getEntityIds(tiaras, 'id'),
        action: equipTiara
    }, {
        type: ActionType.EQUIP_ACTION,
        equipType: 'UNEQUIP',
        itemIds: getEntityIds(tiaras, 'id'),
        action: unequipTiara
    }
]);
