export default {
    opcode: 238,
    size: 4,
    handler: (player, packet) =>
        player.numericInputEvent.next(packet.buffer.get('INT', 'UNSIGNED'))
};
