import { Player } from '@engine/world/actor';
import { PacketData } from '@engine/net';

const buttonClickPacket = (player: Player, packet: PacketData) => {
    const { buffer } = packet;
    const widgetId = buffer.get('short');
    const buttonId = buffer.get('short');

    player.actionPipeline.call('button', player, widgetId, buttonId);
};

export default {
    opcode: 64,
    size: 4,
    handler: buttonClickPacket
};
