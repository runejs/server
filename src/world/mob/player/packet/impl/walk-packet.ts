import { Player } from '../../player';
import { RsBuffer } from '@server/net/rs-buffer';
import { incomingPacket } from '../incoming-packet';

export const walkPacket: incomingPacket = (player: Player, packetId: number, packetSize: number, packet: RsBuffer): void => {
    let size = packetSize;

    if(packetId === 213) {
        size -= 14;
    }

    const totalSteps = Math.floor((size - 5) / 2);

    const firstX = packet.readNegativeOffsetShortLE();
    const runSteps = packet.readByte() === 1; // @TODO ?
    const firstY = packet.readNegativeOffsetShortLE();

    const walkingQueue = player.walkingQueue;

    walkingQueue.clear();
    walkingQueue.valid = true;
    walkingQueue.add(firstX, firstY);

    for(let i = 0; i < totalSteps; i++) {
        const x = packet.readByte();
        const y = packet.readPreNegativeOffsetByte();
        walkingQueue.add(x + firstX, y + firstY);
    }
};
