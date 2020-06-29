const widgetsClosedPacket = (player, packet) => {
    player.closeActiveWidgets(false);
};

export default {
    opcode: 176,
    size: 0,
    handler: widgetsClosedPacket
};
