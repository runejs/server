import type { PacketData } from '@engine/net/inbound-packet-handler';
import type { Player } from '@engine/world/actor/player/player';

const walkPacket = (player: Player, packet: PacketData) => {
    const { buffer, packetSize, packetId } = packet;

    let size = packetSize;
    if (packetId === 236) {
        size -= 14;
    }

    // Check if player can move and isn't delayed
    if (!player.canMove() || player.delayManager.isDelayed()) {
        return;
    }

    const totalSteps = Math.floor((size - 5) / 2);
    const firstY = buffer.get('short', 'u', 'le');
    const runSteps = buffer.get('byte') === 1;
    const firstX = buffer.get('short', 'u', 'le');

    const walkingQueue = player.walkingQueue;

    // Cancel any weak tasks since movement interrupts them
    player.actionsCancelled.next('manual-movement');

    walkingQueue.clear();
    walkingQueue.valid = true;
    walkingQueue.add(firstX, firstY);

    for (let i = 0; i < totalSteps; i++) {
        const x = buffer.get('byte');
        const y = buffer.get('byte');
        walkingQueue.add(x + firstX, y + firstY);
    }
};

export default [
    {
        opcode: 73,
        size: -1,
        handler: walkPacket,
    },
    {
        opcode: 236,
        size: -1,
        handler: walkPacket,
    },
    {
        opcode: 89,
        size: -1,
        handler: walkPacket,
    },
];
