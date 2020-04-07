import { incomingPacket } from '../incoming-packet';
import { Player } from '../../world/actor/player/player';
import { widgetAction } from '@server/world/actor/player/action/widget-action';
import { ByteBuffer } from '@runejs/byte-buffer';

export const widgetInteractionPacket: incomingPacket = (player: Player, packetId: number, packetSize: number, packet: ByteBuffer): void => {
    const childId = packet.get('SHORT');
    const widgetId = packet.get('SHORT');
    const optionId = packet.get('SHORT', 'SIGNED', 'LITTLE_ENDIAN');

    widgetAction(player, widgetId, childId, optionId);
};
