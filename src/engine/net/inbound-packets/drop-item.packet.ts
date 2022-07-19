import { Player } from '@engine/world/actor';
import { PacketData } from '@engine/net';

const dropItemPacket = (player: Player, packet: PacketData) => {
    const { buffer } = packet;
    const widgetId = buffer.get('short', 'u', 'le');
    const containerId = buffer.get('short', 'u', 'le');
    const slot = buffer.get('short', 'u');
    const itemId = buffer.get('short', 'u', 'le');

    player.actionPipeline.call('item_interaction', player, itemId, slot, widgetId, containerId, 'drop');
};

export default {
    opcode: 29,
    size: 8,
    handler: dropItemPacket
};
