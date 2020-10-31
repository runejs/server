import { RunePlugin } from '../../plugins/plugin';

const ignoreButtons = [
    '269:99' // character design accept button
];

const buttonClickPacket = (player, packet) => {
    const { buffer } = packet;
    const widgetId = buffer.get('SHORT');
    const buttonId = buffer.get('SHORT');

    if(ignoreButtons.indexOf(`${widgetId}:${buttonId}`) === -1) {
        RunePlugin.callActionEventListener('button', player, widgetId, buttonId);
    }
};

export default {
    opcode: 64,
    size: 4,
    handler: buttonClickPacket
};
