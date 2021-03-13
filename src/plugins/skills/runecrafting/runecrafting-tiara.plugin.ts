/**
 * @Author NickNick
 */

import { getEntityByAttr, getEntityIds, tiaras } from '@plugins/skills/runecrafting/runecrafting-constants';
import { equipmentChangeActionHandler } from '@engine/world/action/equipment-change.action';


const unequipTiara : equipmentChangeActionHandler = (details) => {
    const { player } = details;
    player.outgoingPackets.updateClientConfig(491, 0);
};

const equipTiara : equipmentChangeActionHandler = (details) => {
    const { player, itemId } = details;
    const tiara = getEntityByAttr(tiaras, 'id', itemId);
    player.outgoingPackets.updateClientConfig(491, tiara.config);
};




export default {
    pluginId: 'rs:runecrafting_tiaras',
    hooks: [
        {
            type: 'equipment_change',
            eventType: 'equip',
            itemIds: getEntityIds(tiaras, 'id'),
            handler: equipTiara
        }, {
            type: 'equipment_change',
            eventType: 'unequip',
            itemIds: getEntityIds(tiaras, 'id'),
            handler: unequipTiara
        }
    ]
};
