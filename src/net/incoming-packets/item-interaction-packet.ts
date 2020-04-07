import { incomingPacket } from '../incoming-packet';
import { Player } from '../../world/actor/player/player';
import { itemAction } from '@server/world/actor/player/action/item-action';
import { getItemOption } from '@server/world/items/item';
import { ByteBuffer } from '@runejs/byte-buffer';

interface ItemInteraction {
    widgetId: number;
    containerId: number;
    itemId: number;
    slot: number;
}

const option1 = (packet: ByteBuffer): ItemInteraction => {
    const itemId = packet.get('SHORT', 'UNSIGNED');
    const slot = packet.get('SHORT', 'UNSIGNED', 'LITTLE_ENDIAN');
    const widgetId = packet.get('SHORT', 'SIGNED', 'LITTLE_ENDIAN');
    const containerId = packet.get('SHORT', 'SIGNED', 'LITTLE_ENDIAN');
    return { widgetId, containerId, itemId, slot };
};

const option2 = (packet: ByteBuffer): ItemInteraction => {
    const itemId = packet.get('SHORT', 'UNSIGNED', 'LITTLE_ENDIAN');
    const containerId = packet.get('SHORT', 'SIGNED', 'LITTLE_ENDIAN');
    const widgetId = packet.get('SHORT', 'SIGNED', 'LITTLE_ENDIAN');
    const slot = packet.get('SHORT', 'UNSIGNED', 'LITTLE_ENDIAN');
    return { widgetId, containerId, itemId, slot };
};

const option3 = (packet: ByteBuffer): ItemInteraction => {
    const slot = packet.get('SHORT', 'UNSIGNED');
    const containerId = packet.get('SHORT', 'SIGNED', 'LITTLE_ENDIAN');
    const widgetId = packet.get('SHORT', 'SIGNED', 'LITTLE_ENDIAN');
    const itemId = packet.get('SHORT', 'UNSIGNED');
    return { widgetId, containerId, itemId, slot };
};

const option4 = (packet: ByteBuffer): ItemInteraction => {
    const itemId = packet.get('SHORT', 'UNSIGNED');
    const slot = packet.get('SHORT', 'UNSIGNED', 'LITTLE_ENDIAN');
    const containerId = packet.get('SHORT', 'SIGNED', 'LITTLE_ENDIAN');
    const widgetId = packet.get('SHORT', 'SIGNED', 'LITTLE_ENDIAN');
    return { widgetId, containerId, itemId, slot };
};

const inventoryOption4 = (packet: ByteBuffer): ItemInteraction => {
    const slot = packet.get('SHORT', 'UNSIGNED');
    const widgetId = packet.get('SHORT', 'SIGNED', 'LITTLE_ENDIAN');
    const containerId = packet.get('SHORT', 'SIGNED', 'LITTLE_ENDIAN');
    const itemId = packet.get('SHORT', 'UNSIGNED');
    return { widgetId, containerId, itemId, slot };
};

export const itemInteractionPacket: incomingPacket = (player: Player, packetId: number, packetSize: number, packet: ByteBuffer): void => {
    const packets = {
        38: { packetDef: option1, optionNumber: 1 },
        228: { packetDef: option2, optionNumber: 2 },
        26: { packetDef: option3, optionNumber: 3 },
        147: { packetDef: option4, optionNumber: 4 },
        98: { packetDef: inventoryOption4, optionNumber: 4 },
    };

    const packetDetails = packets[packetId];
    const { widgetId, containerId, itemId, slot } = packetDetails.packetDef(packet);

    const option = getItemOption(itemId, packetDetails.optionNumber, { widgetId, containerId });

    itemAction(player, itemId, slot, widgetId, containerId, option);
};
