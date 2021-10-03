import { logger } from '@runejs/core';
import { DataType, Endianness, Signedness } from '@runejs/core/buffer';

import { PacketData } from '@engine/net';
import { activeWorld, World } from '@engine/world';
import { Player } from '@engine/world/actor';

const npcInteractionPacket = (player: Player, packet: PacketData) => {
    const { buffer, packetId } = packet;

    const args: { [key: number]: [ DataType, Signedness?, Endianness? ] } = {
        63: [ 'short', 'u', 'le' ],
        116: [ 'short', 'u', 'le' ],
        57: [ 'short', 'u' ],
        /*42: 'readUnsignedShortLE',
        8: 'readUnsignedShortLE'*/
    };
    const npcIndex = buffer.get(...args[packetId]);

    if (npcIndex < 0 || npcIndex > World.MAX_NPCS - 1) {
        return;
    }

    const npc = activeWorld.npcList[npcIndex];
    if (!npc) {
        return;
    }

    const position = npc.position;
    const distance = Math.floor(position.distanceBetween(player.position));

    // Too far away
    if (distance > 16) {
        return;
    }

    const actions = {
        63: 0, // Usually the Talk-to option
        57: 1, // Usually the Attack option
        116: 2, // Usually the Pickpocket option
        /*42: 3,
        8: 4*/
    };

    const morphedNpc = player.getMorphedNpcDetails(npc);
    const options = morphedNpc?.options || npc.options;

    const actionIdx = actions[packetId];
    let optionName = `action-${actionIdx + 1}`;
    if(options && options.length >= actionIdx) {
        if(!options[actionIdx] || options[actionIdx].toLowerCase() === 'hidden') {
            // Invalid action
            logger.info(npc);
            logger.error(`1: Invalid npc ${morphedNpc?.gameId || npc.id} option ${actionIdx + 1}, options: ${JSON.stringify(options)}`);
            if (morphedNpc) {
                logger.warn(`Note: (id-${morphedNpc.gameId}) is a morphed NPC. The parent NPC is (id-${npc.id}).`);
            }
            return;
        }

        optionName = options[actionIdx];
    } else {
        // Invalid action
        logger.error(`2: Invalid npc ${morphedNpc?.gameId || npc.id} option ${actionIdx + 1}, options: ${JSON.stringify(options)}`);
        if (morphedNpc) {
            logger.warn(`Note: (id-${morphedNpc.gameId}) is a morphed NPC. The parent NPC is (id-${npc.id}).`);
        }
        return;
    }

    player.actionPipeline.call('npc_interaction', player, npc, position, optionName.toLowerCase());
};

export default [{
    opcode: 63,
    size: 2,
    handler: npcInteractionPacket
}, {
    opcode: 116,
    size: 2,
    handler: npcInteractionPacket
}, {
    opcode: 57,
    size: 2,
    handler: npcInteractionPacket
}];
