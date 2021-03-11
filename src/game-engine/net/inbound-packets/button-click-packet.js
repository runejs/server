import { actionPipeline } from '../../game-server';

const buttonClickPacket = (player, packet) => {
    const { buffer } = packet;
    const widgetId = buffer.get('SHORT');
    const buttonId = buffer.get('SHORT');

    actionPipeline.call('button', player, widgetId, buttonId);
};

export default {
    opcode: 64,
    size: 4,
    handler: buttonClickPacket
};
