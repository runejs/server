import { incomingPacket } from '../incoming-packet';
import { Player, playerOptions } from '../../world/actor/player/player';
import { world } from '@server/game-server';
import { World } from '@server/world/world';
import { ByteBuffer } from '@runejs/byte-buffer';
import { playerAction } from '@server/world/actor/player/action/player-action';
import { logger } from '@runejs/logger';

export const playerInteractionPacket: incomingPacket = (player: Player, packetId: number, packetSize: number, packet: ByteBuffer): void => {
    const args = {
        68: [ 'SHORT', 'UNSIGNED', 'LITTLE_ENDIAN' ],
        211: [ 'SHORT', 'UNSIGNED', 'LITTLE_ENDIAN' ]
    };
    const playerIndex = packet.get(...args[packetId]) - 1;

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

    playerAction(player, otherPlayer, position, playerOption.option.toLowerCase());
};
