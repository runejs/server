import { world } from '@engine/game-server';
import { World } from '@engine/world';
import { logger } from '@runejs/core';
import { Player, playerOptions } from '@engine/world/actor/player/player';
import { PacketData } from '@engine/net/inbound-packets';

const chatboxRequestResponsePacket = (player: Player, packet: PacketData) => {
    const { buffer } = packet;
    const playerIndex = buffer.get('short', 'u', 'be') - 1;

    if(playerIndex < 0 || playerIndex > World.MAX_PLAYERS - 1) {
        return;
    }

    const otherPlayer = world.playerList[playerIndex];
    if(!otherPlayer) {
        return;
    }

    const position = otherPlayer.position;
    const distance = Math.floor(position.distanceBetween(player.position));

    // Too far away
    if(distance > 16) {
        return;
    }

    player.actionPipeline.call('player_interaction', player, otherPlayer, position, 'request_response');
};

export default {
    opcode: 96,
    size: 2,
    handler: chatboxRequestResponsePacket
};
