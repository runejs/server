import { incomingPacket } from '../incoming-packet';
import { Player } from '../../player';
import { RsBuffer } from '@server/net/rs-buffer';

const dialogueIds = [
    64, 65, 66, 67, 241,
    242,243,244, 228, 230,
    232, 234,
    158, 161, 175,
    167, 171, 170,
    168, 159, 177,
    165, 164, 163,
    160, 174, 169,
    166, 157, 176,
    173, 162, 172,
];

export const widgetActionPacket: incomingPacket = (player: Player, packetId: number, packetSize: number, packet: RsBuffer): void => {
    const childId = packet.readShortBE();
    const widgetId = packet.readShortBE();
    const actionId = packet.readShortLE();

    if(dialogueIds.indexOf(widgetId) !== -1) {
        player.dialogueInteractionEvent.next(childId);
    } else {
        player.packetSender.chatboxMessage(`Unhandled widget interaction ${widgetId},${childId},${actionId}`);
    }
};
