import { actionHandler } from '../../world/action';

const widgetInteractionPacket = (player, packet) => {
    const { buffer } = packet;
    const childId = buffer.get('SHORT');
    const widgetId = buffer.get('SHORT');
    const optionId = buffer.get('SHORT', 'SIGNED', 'LITTLE_ENDIAN');

    actionHandler.call('widget_action', player, widgetId, childId, optionId);
};

export default {
    opcode: 132,
    size: 6,
    handler: widgetInteractionPacket
};
