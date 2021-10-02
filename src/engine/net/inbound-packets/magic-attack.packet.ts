import { Player } from '@engine/world/actor';
import { PacketData } from '@engine/net';
import { world } from '@engine/world';


const magicAttackPacket = (player: Player, packet: PacketData) => {
    const { buffer } = packet;
    const npcWorldIndex = buffer.get('short', 'u'); // unsigned short BE
    const widgetId = buffer.get('short', 'u', 'le'); // unsigned short LE
    const widgetChildId = buffer.get('byte'); // unsigned short LE

    const npc = world.npcList[npcWorldIndex];

    player.actionPipeline.call('magic_on_npc', npc, player, widgetId, widgetChildId);
};

export default [{
    opcode: 253,
    size: 6,
    handler: magicAttackPacket
}];
