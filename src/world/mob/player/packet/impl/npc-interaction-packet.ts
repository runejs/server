import { incomingPacket } from '../incoming-packet';
import { Player } from '../../player';
import { RsBuffer } from '@server/net/rs-buffer';
import { world } from '@server/game-server';
import { World } from '@server/world/world';
import { npcAction } from '@server/world/mob/player/action/npc-action/npc-action';

export const npcInteractionPacket: incomingPacket = (player: Player, packetId: number, packetSize: number, packet: RsBuffer): void => {
    const npcIndex = packet.readUnsignedShortLE();

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

    npcAction(player, npc, position);
};
