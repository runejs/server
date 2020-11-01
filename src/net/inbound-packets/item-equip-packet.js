import { actionHandler } from '../../world/action';

const itemEquipPacket = (player, packet) => {
    const { buffer } = packet;
    const containerId = buffer.get('SHORT', 'SIGNED', 'LITTLE_ENDIAN');
    const widgetId = buffer.get('SHORT', 'SIGNED', 'LITTLE_ENDIAN');
    const slot = buffer.get('SHORT', 'UNSIGNED', 'LITTLE_ENDIAN');
    const itemId = buffer.get('SHORT', 'UNSIGNED');

    actionHandler.call('item_action', player, itemId, slot, widgetId, containerId, 'equip');
};

export default {
    opcode: 102,
    size: 8,
    handler: itemEquipPacket
}
