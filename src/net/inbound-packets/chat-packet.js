const chatPacket = (player, packet) => {
    const { buffer } = packet;
    buffer.get();
    const color = buffer.get();
    const effects = buffer.get();
    const data = Buffer.from(buffer.getSlice(buffer.readerIndex, buffer.length - buffer.readerIndex));
    player.updateFlags.addChatMessage({ color, effects, data });
};

export default {
    opcode: 75,
    size: -3,
    handler: chatPacket
};
