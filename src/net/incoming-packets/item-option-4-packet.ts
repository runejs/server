import { incomingPacket } from '../incoming-packet';
import { RsBuffer } from '@server/net/rs-buffer';
import { Player } from '../../world/actor/player/player';
import { itemAction } from '@server/world/actor/player/action/item-action';
import { getItemOption } from '@server/world/items/item';

export const itemOption4Packet: incomingPacket = (player: Player, packetId: number, packetSize: number, packet: RsBuffer): void => {
    const slot = packet.readShortBE();
    const widgetId = packet.readShortLE();
    const containerId = packet.readShortLE();
    const itemId = packet.readShortBE();
    // packet.readNegativeOffsetShortBE();
    // packet.readUnsignedShortLE();
    // packet.readShortLE(); // either widget id or container id
    // packet.readShortLE(); // either widget id or container id
    //
    // Class32.packetBuffer.putShortBE(i);
    // Class32.packetBuffer.putIntME1(i_10_);
    // Class32.packetBuffer.putShortBE(i_12_);
    //
    // Class32.packetBuffer.putCustomNegativeOffsetShortBE(i_12_, -128);
    // Class32.packetBuffer.putShortLE(i);
    // Class32.packetBuffer.putIntME1(i_10_);

    const option = getItemOption(itemId, 4, { widgetId, containerId });

    itemAction(player, itemId, slot, widgetId, containerId, option);
};
