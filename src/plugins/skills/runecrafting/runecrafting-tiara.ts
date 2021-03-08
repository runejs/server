/**
 * @Author NickNick
 */

import { getEntityByAttr, getEntityIds, tiaras } from '@server/plugins/skills/runecrafting/runecrafting-constants';
import { equipHandler } from '@server/world/action/equip-action';


const unequipTiara : equipHandler = (details) => {
    const { player } = details;
    player.outgoingPackets.updateClientConfig(491, 0);
};

const equipTiara : equipHandler = (details) => {
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
