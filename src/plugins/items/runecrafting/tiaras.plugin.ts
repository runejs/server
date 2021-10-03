import { equipmentChangeActionHandler } from '@engine/action/pipe/equipment-change.action';

export const equip: equipmentChangeActionHandler = (details) => {
    const { player } = details;
    player.outgoingPackets.updateClientConfig(491, 1);
};
export const unequip: equipmentChangeActionHandler = (details) => {
    const { player } = details;
    player.outgoingPackets.updateClientConfig(491, 0);
};

export default {
    pluginId: 'rs:tiaras',
    hooks: [
        {
            type: 'equipment_change',
            eventType: 'equip',
            handler: equip,
            itemIds: 5527
        }, {
            type: 'equipment_change',
            eventType: 'unequip',
            handler: unequip,
            itemIds: 5527
        }
    ]
};
