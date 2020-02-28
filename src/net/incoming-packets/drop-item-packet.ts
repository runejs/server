import { incomingPacket } from '../incoming-packet';
import { Player } from '../../world/actor/player/player';
import { RsBuffer } from '@server/net/rs-buffer';
import { itemAction } from '@server/world/actor/player/action/item-action';

export const dropItemPacket: incomingPacket = (player: Player, packetId: number, packetSize: number, packet: RsBuffer): void => {
    const widgetId = packet.readUnsignedShortLE();
    const containerId = packet.readUnsignedShortLE();
    const slot = packet.readNegativeOffsetShortBE();
    const itemId = packet.readUnsignedShortLE();

    itemAction(player, itemId, slot, widgetId, containerId, 'drop');
};
