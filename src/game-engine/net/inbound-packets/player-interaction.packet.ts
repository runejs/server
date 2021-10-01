import { logger } from '@runejs/core';

import { world } from '@engine/game-server';
import { World } from '@engine/world';
import { Player, playerOptions } from '@engine/world/actor';
import { PacketData } from '@engine/net';
import { DataType, Endianness, Signedness } from '@runejs/core/buffer';

const playerInteractionPacket = (player: Player, packet: PacketData) => {
    const { buffer, packetId } = packet;
    const args: { [key: number]: [ DataType, Signedness?, Endianness? ] } = {
        68: [ 'short', 'u', 'le' ],
        211: [ 'short', 'u', 'le' ]
    };
    const playerIndex = buffer.get(...args[packetId]) - 1;

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

    const actions = {
        68: 0,
        211: 1
    };

    const playerOption = playerOptions.find(playerOption => playerOption.index === actions[packetId]);

    if(!playerOption) {
        logger.error(`Invalid player option ${actions[packetId]}!`);
        return;
    }

    player.actionPipeline.call('player_interaction', player, otherPlayer, position, playerOption.option.toLowerCase());
};

export default [{
    opcode: 68,
    size: 2,
    handler: playerInteractionPacket
}, {
    opcode: 211,
    size: 2,
    handler: playerInteractionPacket
}];
