/**
 * @Author NickNick
 */
import {
    altars,
    getEntityByAttr,
    getEntityIds,
    runes,
    talismans,
} from '@server/plugins/skills/runecrafting/runecrafting-constants';
import { itemOnObjectAction, ItemOnObjectActionData } from '@server/world/action/item-on-object-action';
import { cache } from '@server/game-server';
import { objectAction, ObjectActionData } from '@server/world/action/object-action';
import { RunecraftingAltar, RunecraftingRune } from '@server/plugins/skills/runecrafting/runecrafting-types';
import { itemIds } from '@server/world/config/item-ids';
import { Player } from '@server/world/actor/player/player';
import { Item } from '@server/world/items/item';


const enterAltar: itemOnObjectAction = (details: ItemOnObjectActionData) => {
    const {player, object, item} = details;
    const altar: RunecraftingAltar = getEntityByAttr(altars, 'entranceId', object.objectId);
    const rune: RunecraftingRune = getEntityByAttr(runes, 'altar.entranceId', object.objectId);

    if (item.itemId === itemIds.talismans.elemental) {
        if (rune.talisman.id === itemIds.talismans.air
            || rune.talisman.id === itemIds.talismans.water
            || rune.talisman.id === itemIds.talismans.earth
            || rune.talisman.id === itemIds.talismans.fire) {
            finishEnterAltar(player, item, altar);
            return;
        }
    }

    // Wrong talisman.
    if (item.itemId !== rune.talisman.id) {
        player.sendMessage('Nothing interesting happens.');
        return;
    }

    // Correct talisman.
    if (item.itemId === rune.talisman.id) {
        finishEnterAltar(player, item, altar);

    }
};

function finishEnterAltar(player: Player, item: Item, altar: RunecraftingAltar): void {
    const talisman = cache.itemDefinitions.get(item.itemId);
    player.sendMessage(`You hold the ${talisman.name} towards the mysterious ruins.`);
    player.sendMessage(`You feel a powerful force take hold of you..`);
    player.teleport(altar.entrance);
}


const exitAltar: objectAction = (details: ObjectActionData) => {
    const {player, object} = details;
    const altar = getEntityByAttr(altars, 'portalId', object.objectId);
    player.teleport(altar.exit);
};


export default [
    {
        type: 'item_on_object',
        itemIds: getEntityIds(talismans, 'id'),
        objectIds: getEntityIds(altars, 'entranceId'),
        walkTo: true,
        action: enterAltar
    }, {
        type: 'object_action',
        objectIds: getEntityIds(altars, 'portalId'),
        walkTo: true,
        action: exitAltar
    }
];
