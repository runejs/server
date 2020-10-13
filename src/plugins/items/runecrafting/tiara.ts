import { ActionType, RunePlugin } from '@server/plugins/plugin';
import { equipAction } from '@server/world/actor/player/action/equip-action';

export const equip: equipAction = (details) => {
    const {player} = details;
    player.outgoingPackets.updateClientConfig(491, 1);
};
export const unequip: equipAction = (details) => {
    const {player} = details;
    player.outgoingPackets.updateClientConfig(491, 0);
};

export default new RunePlugin([{
    type: ActionType.EQUIP_ACTION,
    equipType: 'EQUIP',
    action: equip,
    itemIds: 5527
}, {
    type: ActionType.EQUIP_ACTION,
    equipType: 'UNEQUIP',
    action: unequip,
    itemIds: 5527
}]);
