const buttonClickPacket = (player, packet) => {
    const { buffer } = packet;
    const widgetId = buffer.get('short');
    const buttonId = buffer.get('short');

    player.actionPipeline.call('button', player, widgetId, buttonId);
};

export default {
    opcode: 64,
    size: 4,
    handler: buttonClickPacket
};
