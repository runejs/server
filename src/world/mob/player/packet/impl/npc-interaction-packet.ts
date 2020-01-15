import { incomingPacket } from '../incoming-packet';
import { Player } from '../../player';
import { RsBuffer } from '@server/net/rs-buffer';
import { world } from '@server/game-server';
import { World } from '@server/world/world';
import { npcAction } from '@server/world/mob/player/action/npc-action';

export const npcInteractionPacket: incomingPacket = (player: Player, packetId: number, packetSize: number, packet: RsBuffer): void => {
    const npcIndex = packet.readUnsignedShortLE();

    if(npcIndex < 0 || npcIndex > World.MAX_NPCS - 1) {
        return;
    }

    const npc = world.npcList[npcIndex];
    if(!npc) {
        return;
    }

    const distance = Math.floor(npc.position.distanceBetween(player.position));

    if(distance > 16) {
        return;
    }

    if(distance === 1) {
        npcAction(player, npc);
    } else {
        // @TODO wait for the player to finish walking to their target
        npcAction(player, npc);
    }
};
