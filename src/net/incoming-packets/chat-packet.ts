import { incomingPacket } from '../incoming-packet';
import { Player } from '../../world/actor/player/player';
import { ByteBuffer } from '@runejs/byte-buffer';

export const chatPacket: incomingPacket = (player: Player, packetId: number, packetSize: number, packet: ByteBuffer): void => {
    packet.get();
    const color: number = packet.get();
    const effects: number = packet.get();
    const data: Buffer = Buffer.from(packet.getSlice(packet.readerIndex, packet.length - packet.readerIndex));
    player.updateFlags.addChatMessage({ color, effects, data });
};
