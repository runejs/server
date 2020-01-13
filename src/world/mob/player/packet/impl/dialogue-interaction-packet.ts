import { incomingPacket } from '../incoming-packet';
import { Player } from '../../player';
import { RsBuffer } from '@server/net/rs-buffer';

export const dialogueInteractionPacket: incomingPacket = (player: Player, packetId: number, packetSize: number, packet: RsBuffer): void => {
    const actionId = packet.readUnsignedShortBE();
    player.dialogueInteractionEvent.next(actionId);
};
