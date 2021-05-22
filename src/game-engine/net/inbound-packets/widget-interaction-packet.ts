import { Player } from '@engine/world/actor/player/player';
import { PacketData } from '@engine/net/inbound-packets';


const widgetInteractionPacket = (player: Player, packet: PacketData) => {
    const { buffer } = packet;
    const childId = buffer.get('short');
    const widgetId = buffer.get('short');
    const optionId = buffer.get('short', 's', 'le');

    player.actionPipeline.call('widget_interaction', player, widgetId, childId, optionId);
};

export default {
    opcode: 132,
    size: 6,
    handler: widgetInteractionPacket
};
