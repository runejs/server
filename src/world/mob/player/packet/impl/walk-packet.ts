import { Player } from '../../player';
import { RsBuffer } from '@server/net/rs-buffer';
import { incomingPacket } from '../incoming-packet';

export const walkPacket: incomingPacket = (player: Player, packetId: number, packetSize: number, packet: RsBuffer): void => {
    let size = packetSize;
    if(packetId == 236) {
        size -= 14;
    }

    const totalSteps = Math.floor((size - 5) / 2);

    const firstY = packet.readUnsignedShortLE();
    const runSteps = packet.readUnsignedByteInverted() === 1; // @TODO forced running
    const firstX = packet.readUnsignedShortLE();

    const walkingQueue = player.walkingQueue;

    player.walkingTo = null;
    walkingQueue.clear();
    walkingQueue.valid = true;
    walkingQueue.add(firstX, firstY);

    for(let i = 0; i < totalSteps; i++) {
        const x = packet.readPostNegativeOffsetByte();
        const y = packet.readByteInverted();
        walkingQueue.add(x + firstX, y + firstY);
    }
};
