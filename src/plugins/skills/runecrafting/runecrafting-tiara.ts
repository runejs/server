/**
 * @Author NickNick
 */

import { getEntityByAttr, getEntityIds, tiaras } from '@server/plugins/skills/runecrafting/runecrafting-constants';
import { equipAction } from '@server/world/actor/player/action/equip-action';


const unequipTiara : equipAction = (details) => {
    const { player } = details;
    player.outgoingPackets.updateClientConfig(491, 0);
};

const equipTiara : equipAction = (details) => {
    const { player, itemId } = details;
    const tiara = getEntityByAttr(tiaras, 'id', itemId);
    player.outgoingPackets.updateClientConfig(491, tiara.config);
};




export default [
    {
        type: 'equip_action',
        equipType: 'EQUIP',
        itemIds: getEntityIds(tiaras, 'id'),
        action: equipTiara
    }, {
        type: 'equip_action',
        equipType: 'UNEQUIP',
        itemIds: getEntityIds(tiaras, 'id'),
        action: unequipTiara
    }
];
