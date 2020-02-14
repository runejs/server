import { incomingPacket } from '../incoming-packet';
import { Player } from '../../player';
import { RsBuffer } from '@server/net/rs-buffer';

export const chatPacket: incomingPacket = (player: Player, packetId: number, packetSize: number, packet: RsBuffer): void => {
    const color: number = packet.readByteInverted();
    const effects: number = packet.readPostNegativeOffsetByte();
    const data: Buffer = packet.getUnreadData();
    player.updateFlags.addChatMessage({ color, effects, data });
};
