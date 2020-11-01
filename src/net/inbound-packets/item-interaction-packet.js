import { getItemOption } from '../../world/items/item';
import { actionHandler } from '../../world/action';

const option1 = buffer => {
    const itemId = buffer.get('SHORT', 'UNSIGNED');
    const slot = buffer.get('SHORT', 'UNSIGNED', 'LITTLE_ENDIAN');
    const widgetId = buffer.get('SHORT', 'SIGNED', 'LITTLE_ENDIAN');
    const containerId = buffer.get('SHORT', 'SIGNED', 'LITTLE_ENDIAN');
    return { widgetId, containerId, itemId, slot };
};

const option2 = buffer => {
    const itemId = buffer.get('SHORT', 'UNSIGNED', 'LITTLE_ENDIAN');
    const containerId = buffer.get('SHORT', 'SIGNED', 'LITTLE_ENDIAN');
    const widgetId = buffer.get('SHORT', 'SIGNED', 'LITTLE_ENDIAN');
    const slot = buffer.get('SHORT', 'UNSIGNED', 'LITTLE_ENDIAN');
    return { widgetId, containerId, itemId, slot };
};

const option3 = buffer => {
    const slot = buffer.get('SHORT', 'UNSIGNED');
    const containerId = buffer.get('SHORT', 'SIGNED', 'LITTLE_ENDIAN');
    const widgetId = buffer.get('SHORT', 'SIGNED', 'LITTLE_ENDIAN');
    const itemId = buffer.get('SHORT', 'UNSIGNED');
    return { widgetId, containerId, itemId, slot };
};

const option4 = buffer => {
    const itemId = buffer.get('SHORT', 'UNSIGNED');
    const slot = buffer.get('SHORT', 'UNSIGNED', 'LITTLE_ENDIAN');
    const containerId = buffer.get('SHORT', 'SIGNED', 'LITTLE_ENDIAN');
    const widgetId = buffer.get('SHORT', 'SIGNED', 'LITTLE_ENDIAN');
    return { widgetId, containerId, itemId, slot };
};

const inventoryOption1 = buffer => {
    const slot = buffer.get('SHORT', 'UNSIGNED', 'LITTLE_ENDIAN');
    const itemId = buffer.get('SHORT', 'SIGNED', 'LITTLE_ENDIAN');
    const containerId = buffer.get('SHORT', 'SIGNED', 'LITTLE_ENDIAN');
    const widgetId = buffer.get('SHORT', 'UNSIGNED');
    return { widgetId, containerId, itemId, slot };
};

const inventoryOption4 = buffer => {
    const slot = buffer.get('SHORT', 'UNSIGNED');
    const widgetId = buffer.get('SHORT', 'SIGNED', 'LITTLE_ENDIAN');
    const containerId = buffer.get('SHORT', 'SIGNED', 'LITTLE_ENDIAN');
    const itemId = buffer.get('SHORT', 'UNSIGNED');
    return { widgetId, containerId, itemId, slot };
};

const itemInteractionPacket = (player, packet) => {
    const { packetId } = packet;
    const packets = {
        38: { packetDef: option1, optionNumber: 1 },
        228: { packetDef: option2, optionNumber: 2 },
        26: { packetDef: option3, optionNumber: 3 },
        147: { packetDef: option4, optionNumber: 4 },
        98: { packetDef: inventoryOption4, optionNumber: 4 },
        240: { packetDef: inventoryOption1, optionNumber: 1 },
    };

    const packetDetails = packets[packetId];
    const { widgetId, containerId, itemId, slot } = packetDetails.packetDef(packet.buffer);

    const option = getItemOption(itemId, packetDetails.optionNumber, { widgetId, containerId });

    actionHandler.call('item_action', player, itemId, slot, widgetId, containerId, option);
};

export default [{
    opcode: 38,
    size: 8,
    handler: itemInteractionPacket
},{
    opcode: 98,
    size: 8,
    handler: itemInteractionPacket
},{
    opcode: 228,
    size: 8,
    handler: itemInteractionPacket
},{
    opcode: 26,
    size: 8,
    handler: itemInteractionPacket
},{
    opcode: 147,
    size: 8,
    handler: itemInteractionPacket
},{
    opcode: 240,
    size: 8,
    handler: itemInteractionPacket
}];
