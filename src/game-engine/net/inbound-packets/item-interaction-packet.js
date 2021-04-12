import { getItemOption } from '../../world/items/item';

const option1 = buffer => {
    const itemId = buffer.get('short', 'u');
    const slot = buffer.get('short', 'u', 'le');
    const widgetId = buffer.get('short', 's', 'le');
    const containerId = buffer.get('short', 's', 'le');
    return { widgetId, containerId, itemId, slot };
};

const option2 = buffer => {
    const itemId = buffer.get('short', 'u', 'le');
    const containerId = buffer.get('short', 's', 'le');
    const widgetId = buffer.get('short', 's', 'le');
    const slot = buffer.get('short', 'u', 'le');
    return { widgetId, containerId, itemId, slot };
};

const option3 = buffer => {
    const slot = buffer.get('short', 'u');
    const containerId = buffer.get('short', 's', 'le');
    const widgetId = buffer.get('short', 's', 'le');
    const itemId = buffer.get('short', 'u');
    return { widgetId, containerId, itemId, slot };
};

const option4 = buffer => {
    const itemId = buffer.get('short', 'u');
    const slot = buffer.get('short', 'u', 'le');
    const containerId = buffer.get('short', 's', 'le');
    const widgetId = buffer.get('short', 's', 'le');
    return { widgetId, containerId, itemId, slot };
};

const option5 = buffer => {
    const containerId = buffer.get('short', 's', 'le');
    const widgetId = buffer.get('short', 's', 'le');
    const slot = buffer.get('short', 'u', 'le');
    const itemId = buffer.get('short', 'u');
    return { widgetId, containerId, itemId, slot };
};

const inventoryOption1 = buffer => {
    const slot = buffer.get('short', 'u', 'le');
    const itemId = buffer.get('short', 's', 'le');
    const containerId = buffer.get('short', 's', 'le');
    const widgetId = buffer.get('short', 'u');
    return { widgetId, containerId, itemId, slot };
};

const inventoryOption4 = buffer => {
    const slot = buffer.get('short', 'u');
    const widgetId = buffer.get('short', 's', 'le');
    const containerId = buffer.get('short', 's', 'le');
    const itemId = buffer.get('short', 'u');
    return { widgetId, containerId, itemId, slot };
};

const itemInteractionPacket = (player, packet) => {
    const { packetId } = packet;
    const packets = {
        38: { packetDef: option1, optionNumber: 1 },
        228: { packetDef: option2, optionNumber: 2 },
        26: { packetDef: option3, optionNumber: 3 },
        147: { packetDef: option4, optionNumber: 4 },
        102: { packetDef: option5, optionNumber: 2 },
        98: { packetDef: inventoryOption4, optionNumber: 4 },
        240: { packetDef: inventoryOption1, optionNumber: 1 },
    };

    const packetDetails = packets[packetId];
    const { widgetId, containerId, itemId, slot } = packetDetails.packetDef(packet.buffer);

    const option = getItemOption(itemId, packetDetails.optionNumber, { widgetId, containerId });

    player.actionPipeline.call('item_interaction', player, itemId, slot, widgetId, containerId, option);
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
}, {
    opcode: 102,
    size: 8,
    handler: itemInteractionPacket
}];
