import { incomingPacket } from '../incoming-packet';
import { Player } from '../../world/actor/player/player';
import { RsBuffer } from '@server/net/rs-buffer';
import { inputCommandAction } from '../../world/actor/player/action/input-command-action';

export const commandPacket: incomingPacket = (player: Player, packetId: number, packetSize: number, packet: RsBuffer): void => {
    const input = packet.readNewString();

    if(!input || input.trim().length === 0) {
        return;
    }

    const args = input.trim().split(' ');
    const command = args[0];

    args.splice(0, 1);

    inputCommandAction(player, command, args);
};
