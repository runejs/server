import { incomingPacket } from '../incoming-packet';
import { Player } from '../../player';
import { RsBuffer } from '@server/net/rs-buffer';

export const dialogueInteractionPacket: incomingPacket = (player: Player, packetId: number, packetSize: number, packet: RsBuffer): void => {
    const childId = packet.readShortBE();
    const widgetId = packet.readShortBE();
    const actionId = packet.readShortLE();
    player.dialogueInteractionEvent.next(childId);
};
