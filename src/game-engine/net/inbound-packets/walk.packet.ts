import { Player } from '@engine/world/actor';
import { PacketData } from '@engine/net';

const walkPacket = (player: Player, packet: PacketData) => {
    const { buffer, packetSize, packetId } = packet;

    let size = packetSize;
    if(packetId === 236) {
        size -= 14;
    }

    const totalSteps = Math.floor((size - 5) / 2);

    const firstY = buffer.get('short', 'u', 'le');
    const runSteps = buffer.get('byte') === 1; // @TODO forced running
    const firstX = buffer.get('short', 'u', 'le');

    const walkingQueue = player.walkingQueue;

    player.actionsCancelled.next('manual-movement');

    if(player.metadata.walkingTo) {
        delete player.metadata.walkingTo;
    }

    walkingQueue.clear();
    walkingQueue.valid = true;
    walkingQueue.add(firstX, firstY);

    for(let i = 0; i < totalSteps; i++) {
        const x = buffer.get('byte');
        const y = buffer.get('byte');
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
