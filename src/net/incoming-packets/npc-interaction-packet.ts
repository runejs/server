import { incomingPacket } from '../incoming-packet';
import { Player } from '../../world/actor/player/player';
import { world } from '@server/game-server';
import { World } from '@server/world/world';
import { npcAction } from '@server/world/actor/player/action/npc-action';
import { logger } from '@runejs/logger';
import { ByteBuffer } from '@runejs/byte-buffer';

export const npcInteractionPacket: incomingPacket = (player: Player, packetId: number, packetSize: number, packet: ByteBuffer): void => {
    const args = {
        63: [ 'SHORT', 'UNSIGNED', 'LITTLE_ENDIAN' ],
        116: [ 'SHORT', 'UNSIGNED', 'LITTLE_ENDIAN' ],
        57: [ 'SHORT', 'UNSIGNED' ],
        /*42: 'readUnsignedShortLE',
        8: 'readUnsignedShortLE'*/
    };
    const npcIndex = packet.get(...args[packetId]);

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
            logger.error(`1: Invalid npc ${npc.id} option ${actionIdx + 1}, options: ${JSON.stringify(npc.options)}`);
            return;
        }

        optionName = npc.options[actionIdx];
    } else {
        // Invalid action
        logger.error(`2: Invalid npc ${npc.id} option ${actionIdx + 1}, options: ${JSON.stringify(npc.options)}`);
        return;
    }

    npcAction(player, npc, position, optionName.toLowerCase());
};
