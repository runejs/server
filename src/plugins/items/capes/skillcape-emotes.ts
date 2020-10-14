import { lockEmote, unlockEmote } from '@server/plugins/buttons/player-emotes-plugin';
import { ActionType, RunePlugin } from '@server/plugins/plugin';
import { equipAction } from '@server/world/actor/player/action/equip-action';

export const skillcapes: Array<number> = [
  9747, 9748, 9750, 9751, 9753, 9754, 9756, 9757, 9759, 9760,
  9762, 9763, 9765, 9766, 9768, 9769, 9771, 9772, 9774, 9775,
  9777, 9778, 9780, 9781, 9786, 9787, 9783, 9784, 9789, 9790,
  9792, 9793, 9795, 9796, 9798, 9799, 9801, 9802, 9804, 9805,
  9807, 9808, 9810, 9811, 9813
];

export const equip: equipAction = (details) => {
    const {player} = details;
    unlockEmote(player, 'SKILLCAPE');
};
export const unequip: equipAction = (details) => {  
    const {player} = details;
    lockEmote(player, 'SKILLCAPE');
    player.stopAnimation();
    player.stopGraphics();
};

export default new RunePlugin([{
    type: ActionType.EQUIP_ACTION,
    equipType: 'EQUIP',
    action: equip,
    itemIds: skillcapes
}, {
    type: ActionType.EQUIP_ACTION,
    equipType: 'UNEQUIP',
    action: unequip,
    itemIds: skillcapes
}]);
