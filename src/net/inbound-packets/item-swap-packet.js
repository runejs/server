import { actionHandler } from '../../world/action';

const itemSwapPacket = (player, packet) => {
    const { buffer } = packet;
    const swapType = buffer.get();
    const fromSlot = buffer.get('SHORT', 'UNSIGNED');
    const toSlot = buffer.get('SHORT', 'UNSIGNED', 'LITTLE_ENDIAN');
    const containerId = buffer.get('SHORT');
    const widgetId = buffer.get('SHORT');

    if(toSlot < 0 || fromSlot < 0) {
        return;
    }

    if(swapType === 0) {
        actionHandler.call('swap_items', player, fromSlot, toSlot, { widgetId, containerId })
    } else if(swapType === 1) {
        actionHandler.call('move_item', player, fromSlot, toSlot, { widgetId, containerId })
    }
};

export default {
    opcode: 83,
    size: 9,
    handler: itemSwapPacket
}
