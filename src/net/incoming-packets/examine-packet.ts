import { incomingPacket } from '../incoming-packet';
import { ByteBuffer } from '@runejs/byte-buffer';
import { Player } from '../../world/actor/player/player';
import { world } from '@server/game-server';

export const examinePacket: incomingPacket = (player: Player, packetId: number, packetSize: number, packet: ByteBuffer): void => {
    const id = packet.get('SHORT', 'SIGNED', 'LITTLE_ENDIAN');

    let message;

    if (packetId === 151) {
        message = world.examine.getItem(id);
    } else if (packetId === 148) {
        message = world.examine.getObject(id);
    } else if (packetId === 247) {
        message = world.examine.getNpc(id);
    }

    if (message) {
        player.sendMessage(message);
    }
};
