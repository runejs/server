import { incomingPacket } from '../incoming-packet';
import { Player } from '../../player';
import { RsBuffer } from '@server/net/rs-buffer';
import { widgetAction } from '@server/world/mob/player/action/widget-action';

export const widgetInteractionPacket: incomingPacket = (player: Player, packetId: number, packetSize: number, packet: RsBuffer): void => {
    const childId = packet.readShortBE();
    const widgetId = packet.readShortBE();
    const optionId = packet.readShortLE();

    widgetAction(player, widgetId, childId, optionId);
};
