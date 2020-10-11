const blinkingTabClickPacket = (player, packet) => {
    const { buffer } = packet;
    const tabIndex = buffer.get();

    const tabClickEventIndex = player.metadata?.tabClickEvent?.tabIndex || -1;

    if(tabClickEventIndex === tabIndex) {
        player.metadata.tabClickEvent.event.next(true);
    }
};

export default {
    opcode: 44,
    size: 1,
    handler: blinkingTabClickPacket
};
