/**
 * @Author NickNick
 */

import { getEntityByAttr, getEntityIds, tiaras } from '@plugins/skills/runecrafting/runecrafting-constants';
import { equipActionHandler } from '@engine/world/action/equipment-change.action';


const unequipTiara : equipActionHandler = (details) => {
    const { player } = details;
    player.outgoingPackets.updateClientConfig(491, 0);
};

const equipTiara : equipActionHandler = (details) => {
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
