import { Player, playerOptions } from '../../world/actor/player/player';
import { world } from '../../game-server';
import { World } from '../../world';
import { logger } from '@runejs/core';
import { PacketData } from '../inbound-packets';


const magicAttackPacket = (player: Player, packet: PacketData) => {
    const { buffer } = packet;
    const npcWorldIndex = buffer.get('short', 'u'); // unsigned short BE
    const widgetId = buffer.get('short', 'u', 'le'); // unsigned short LE
    const widgetChildId = buffer.get(); // unsigned short LE

    const npc = world.npcList[npcWorldIndex];

    player.actionPipeline.call('magic_on_npc', npc, player, widgetId, widgetChildId);
};

export default [{
    opcode: 253,
    size: 6,
    handler: magicAttackPacket
}];
