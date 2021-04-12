const itemSwapPacket = (player, packet) => {
    const { buffer } = packet;
    const swapType = buffer.get();
    const fromSlot = buffer.get('short', 'u');
    const toSlot = buffer.get('short', 'u', 'le');
    const containerId = buffer.get('short');
    const widgetId = buffer.get('short');

    if(toSlot < 0 || fromSlot < 0) {
        return;
    }

    if(swapType === 0) {
        player.actionPipeline.call('item_swap', player, fromSlot, toSlot, { widgetId, containerId })
    } else if(swapType === 1) {
        player.actionPipeline.call('move_item', player, fromSlot, toSlot, { widgetId, containerId })
    }
};

export default {
    opcode: 83,
    size: 9,
    handler: itemSwapPacket
}
