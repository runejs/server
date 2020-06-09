import { Player } from '../../world/actor/player/player';
import { incomingPacket } from '../incoming-packet';
import { ByteBuffer } from '@runejs/byte-buffer';

export const walkPacket: incomingPacket = (player: Player, packetId: number, packetSize: number, packet: ByteBuffer): void => {
    let size = packetSize;
    if(packetId == 236) {
        size -= 14;
    }

    const totalSteps = Math.floor((size - 5) / 2);

    const firstY = packet.get('SHORT', 'UNSIGNED', 'LITTLE_ENDIAN');
    const runSteps = packet.get() === 1; // @TODO forced running
    const firstX = packet.get('SHORT', 'UNSIGNED', 'LITTLE_ENDIAN');

    const walkingQueue = player.walkingQueue;

    player.actionsCancelled.next('manual-movement');
    player.walkingTo = null;
    walkingQueue.clear();
    walkingQueue.valid = true;
    walkingQueue.add(firstX, firstY);

    for(let i = 0; i < totalSteps; i++) {
        const x = packet.get();
        const y = packet.get();
        walkingQueue.add(x + firstX, y + firstY);
    }
};
