const walkPacket = (player, packet) => {
    const { buffer, packetSize, packetId } = packet;

    let size = packetSize;
    if(packetId == 236) {
        size -= 14;
    }

    const totalSteps = Math.floor((size - 5) / 2);

    const firstY = buffer.get('SHORT', 'UNSIGNED', 'LITTLE_ENDIAN');
    const runSteps = buffer.get() === 1; // @TODO forced running
    const firstX = buffer.get('SHORT', 'UNSIGNED', 'LITTLE_ENDIAN');

    const walkingQueue = player.walkingQueue;

    player.actionsCancelled.next('manual-movement');
    player.walkingTo = null;
    walkingQueue.clear();
    walkingQueue.valid = true;
    walkingQueue.add(firstX, firstY);

    for(let i = 0; i < totalSteps; i++) {
        const x = buffer.get();
        const y = buffer.get();
        walkingQueue.add(x + firstX, y + firstY);
    }
};

export default [{
    opcode: 73,
    size: -1,
    handler: walkPacket
}, {
    opcode: 236,
    size: -1,
    handler: walkPacket
}, {
    opcode: 89,
    size: -1,
    handler: walkPacket
}];
