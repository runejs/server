import { incomingPacket } from '../incoming-packet';
import { Player } from '../../world/actor/player/player';
import { itemAction } from '@server/world/actor/player/action/item-action';
import { ByteBuffer } from '@runejs/byte-buffer';

export const dropItemPacket: incomingPacket = (player: Player, packetId: number, packetSize: number, packet: ByteBuffer): void => {
    const widgetId = packet.get('SHORT', 'UNSIGNED', 'LITTLE_ENDIAN');
    const containerId = packet.get('SHORT', 'UNSIGNED', 'LITTLE_ENDIAN');
    const slot = packet.get('SHORT', 'UNSIGNED');
    const itemId = packet.get('SHORT', 'UNSIGNED', 'LITTLE_ENDIAN');

    itemAction(player, itemId, slot, widgetId, containerId, 'drop');
};
