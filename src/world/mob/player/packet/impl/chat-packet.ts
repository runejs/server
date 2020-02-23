import { incomingPacket } from '../incoming-packet';
import { Player } from '../../player';
import { RsBuffer } from '@server/net/rs-buffer';

export const chatPacket: incomingPacket = (player: Player, packetId: number, packetSize: number, packet: RsBuffer): void => {
    packet.readByte();
    const color: number = packet.readByte();
    const effects: number = packet.readByte();
    const data: Buffer = packet.getUnreadData();
    player.updateFlags.addChatMessage({ color, effects, data });
};
