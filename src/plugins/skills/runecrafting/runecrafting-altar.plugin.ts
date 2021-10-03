/**
 * @Author NickNick
 */
import {
    altars,
    getEntityByAttr,
    getEntityIds,
    runes,
    talismans,
} from '@plugins/skills/runecrafting/runecrafting-constants';
import { itemOnObjectActionHandler, ItemOnObjectAction } from '@engine/action/item-on-object.action';
import { filestore } from '@server/game/game-server';
import { objectInteractionActionHandler, ObjectInteractionAction } from '@engine/action/object-interaction.action';
import { RunecraftingAltar, RunecraftingRune } from '@plugins/skills/runecrafting/runecrafting-types';
import { itemIds } from '@engine/world/config/item-ids';
import { Player } from '@engine/world/actor/player/player';
import { Item } from '@engine/world/items/item';
import { findItem } from '@engine/config/config-handler';


const enterAltar: itemOnObjectActionHandler = (details: ItemOnObjectAction) => {
    const { player, object, item } = details;
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
    const talisman = findItem(item.itemId);
    player.sendMessage(`You hold the ${talisman.name} towards the mysterious ruins.`);
    player.sendMessage(`You feel a powerful force take hold of you..`);
    player.teleport(altar.entrance);
}


const exitAltar: objectInteractionActionHandler = (details: ObjectInteractionAction) => {
    const { player, object } = details;
    const altar = getEntityByAttr(altars, 'portalId', object.objectId);
    player.teleport(altar.exit);
};


export default {
    pluginId: 'rs:runecrafting_altars',
    hooks: [
        {
            type: 'item_on_object',
            itemIds: getEntityIds(talismans, 'id'),
            objectIds: getEntityIds(altars, 'entranceId'),
            walkTo: true,
            handler: enterAltar
        }, {
            type: 'object_interaction',
            objectIds: getEntityIds(altars, 'portalId'),
            walkTo: true,
            handler: exitAltar
        }
    ]
};
