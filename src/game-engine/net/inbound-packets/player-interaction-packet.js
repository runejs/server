import { playerOptions } from '../../world/actor/player/player';
import { world } from '../../game-server';
import { World } from '../../world/world';
import { logger } from '@runejs/core';

const playerInteractionPacket = (player, packet) => {
    const { buffer, packetId } = packet;
    const args = {
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
