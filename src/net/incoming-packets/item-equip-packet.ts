import { incomingPacket } from '../incoming-packet';
import { Player } from '../../world/actor/player/player';
import { RsBuffer } from '@server/net/rs-buffer';
import { itemAction } from '@server/world/actor/player/action/item-action';

export const itemEquipPacket: incomingPacket = (player: Player, packetId: number, packetSize: number, packet: RsBuffer): void => {
    const containerId = packet.readShortLE();
    const widgetId = packet.readShortLE();
    const slot = packet.readNegativeOffsetShortLE();
    const itemId = packet.readShortBE();

    itemAction(player, itemId, slot, widgetId, containerId, 'equip');
};
