import { World } from '../../game-server';

const widgetInteractionPacket = (player, packet) => {
    const { buffer } = packet;
    const childId = buffer.get('SHORT');
    const widgetId = buffer.get('SHORT');
    const optionId = buffer.get('SHORT', 'SIGNED', 'LITTLE_ENDIAN');

    World.callActionEventListener('widget_action', widgetId, childId, optionId);
};

export default {
    opcode: 132,
    size: 6,
    handler: widgetInteractionPacket
};
