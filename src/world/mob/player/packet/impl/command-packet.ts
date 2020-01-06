import { incomingPacket } from '../incoming-packet';
import { Player } from '../../player';
import { RsBuffer } from '@server/net/rs-buffer';
import { inputCommandAction } from '../../action/input-command-action';

export const commandPacket: incomingPacket = (player: Player, packetId: number, packetSize: number, packet: RsBuffer): void => {
    const input = packet.readString();

    if(!input || input.trim().length === 0) {
        return;
    }

    const args = input.trim().split(' ');
    const command = args[0];

    args.splice(0, 1);

    inputCommandAction(player, command, args);
};
