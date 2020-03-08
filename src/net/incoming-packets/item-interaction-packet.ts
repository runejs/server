import { incomingPacket } from '../incoming-packet';
import { RsBuffer } from '@server/net/rs-buffer';
import { Player } from '../../world/actor/player/player';
import { itemAction } from '@server/world/actor/player/action/item-action';
import { getItemOption } from '@server/world/items/item';

interface ItemInteraction {
    widgetId: number;
    containerId: number;
    itemId: number;
    slot: number;
}

const option1 = (packet: RsBuffer): ItemInteraction => {
    const itemId = packet.readNegativeOffsetShortBE();
    const slot = packet.readShortLE();
    const widgetId = packet.readShortLE();
    const containerId = packet.readShortLE();
    return { widgetId, containerId, itemId, slot };
};

const option2 = (packet: RsBuffer): ItemInteraction => {
    const itemId = packet.readUnsignedShortLE();
    const containerId = packet.readShortLE();
    const widgetId = packet.readShortLE();
    const slot = packet.readUnsignedShortLE();
    return { widgetId, containerId, itemId, slot };
};

const option3 = (packet: RsBuffer): ItemInteraction => {
    const slot = packet.readNegativeOffsetShortBE();
    const containerId = packet.readShortLE();
    const widgetId = packet.readShortLE();
    const itemId = packet.readNegativeOffsetShortBE();
    return { widgetId, containerId, itemId, slot };
};

const option4 = (packet: RsBuffer): ItemInteraction => {
    const itemId = packet.readNegativeOffsetShortBE();
    const slot = packet.readUnsignedShortLE();
    const containerId = packet.readShortLE();
    const widgetId = packet.readShortLE();
    return { widgetId, containerId, itemId, slot };
};

const inventoryOption4 = (packet: RsBuffer): ItemInteraction => {
    const slot = packet.readShortBE();
    const widgetId = packet.readShortLE();
    const containerId = packet.readShortLE();
    const itemId = packet.readShortBE();
    return { widgetId, containerId, itemId, slot };
};

export const itemInteractionPacket: incomingPacket = (player: Player, packetId: number, packetSize: number, packet: RsBuffer): void => {
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
