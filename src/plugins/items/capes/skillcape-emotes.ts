import { lockEmote, unlockEmote } from '@server/plugins/buttons/player-emotes-plugin';
import { equipAction } from '@server/world/action/equip-action';
import { itemIds } from '@server/world/config/item-ids';

export const skillcapeIds: Array<number> = Object.keys(
    itemIds.skillCapes).flatMap(skill => [itemIds.skillCapes[skill].untrimmed, itemIds.skillCapes[skill].trimmed]
);

export const equip: equipAction = (details) => {
    const { player } = details;
    unlockEmote(player, 'SKILLCAPE');
};

export const unequip: equipAction = (details) => {  
    const { player } = details;
    lockEmote(player, 'SKILLCAPE');
    player.stopAnimation();
    player.stopGraphics();
};

export default [{
    type: 'equip_action',
    equipType: 'EQUIP',
    action: equip,
    itemIds: skillcapeIds
}, {
    type: 'equip_action',
    equipType: 'UNEQUIP',
    action: unequip,
    itemIds: skillcapeIds
}];
