import { lockEmote, unlockEmote } from '@plugins/buttons/player-emotes.plugin';
import { equipmentChangeActionHandler } from '@engine/action/equipment-change.action';
import { itemIds } from '@engine/world/config/item-ids';

export const skillcapeIds: Array<number> = Object.keys(
    itemIds.skillCapes).flatMap(skill => [itemIds.skillCapes[skill].untrimmed, itemIds.skillCapes[skill].trimmed]
);

export const equip: equipmentChangeActionHandler = (details) => {
    const { player } = details;
    unlockEmote(player, 'SKILLCAPE');
};

export const unequip: equipmentChangeActionHandler = (details) => {
    const { player } = details;
    lockEmote(player, 'SKILLCAPE');
    player.stopAnimation();
    player.stopGraphics();
};

export default {
    pluginId: 'rs:skillcape_emotes',
    hooks: [
        {
            type: 'equipment_change',
            eventType: 'equip',
            handler: equip,
            itemIds: skillcapeIds
        }, {
            type: 'equipment_change',
            eventType: 'unequip',
            handler: unequip,
            itemIds: skillcapeIds
        }
    ]
};
