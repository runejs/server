import { world } from '../../game-server';
import { World } from '../../world';
import { logger } from '@runejs/core';
import { actionHandler } from '../../world/action';

const npcInteractionPacket = (player, packet) => {
    const { buffer, packetId } = packet;

    const args = {
        63: [ 'SHORT', 'UNSIGNED', 'LITTLE_ENDIAN' ],
        116: [ 'SHORT', 'UNSIGNED', 'LITTLE_ENDIAN' ],
        57: [ 'SHORT', 'UNSIGNED' ],
        /*42: 'readUnsignedShortLE',
        8: 'readUnsignedShortLE'*/
    };
    const npcIndex = buffer.get(...args[packetId]);

    if(npcIndex < 0 || npcIndex > World.MAX_NPCS - 1) {
        return;
    }

    const npc = world.npcList[npcIndex];
    if(!npc) {
        return;
    }

    const position = npc.position;
    const distance = Math.floor(position.distanceBetween(player.position));

    // Too far away
    if(distance > 16) {
        return;
    }

    const actions = {
        63: 0, // Usually the Talk-to option
        57: 1, // Usually the Attack option
        116: 2, // Usually the Pickpocket option
        /*42: 3,
        8: 4*/
    };

    const actionIdx = actions[packetId];
    let optionName = `action-${actionIdx + 1}`;
    if(npc.options && npc.options.length >= actionIdx) {
        if(!npc.options[actionIdx] || npc.options[actionIdx].toLowerCase() === 'hidden') {
            // Invalid action
            logger.info(npc);
            logger.error(`1: Invalid npc ${npc.id} option ${actionIdx + 1}, options: ${JSON.stringify(npc.options)}`);
            return;
        }

        optionName = npc.options[actionIdx];
    } else {
        // Invalid action
        logger.error(`2: Invalid npc ${npc.id} option ${actionIdx + 1}, options: ${JSON.stringify(npc.options)}`);
        return;
    }

    actionHandler.call('npc_action', player, npc, position, optionName.toLowerCase());
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
