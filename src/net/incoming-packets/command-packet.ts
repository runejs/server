import { incomingPacket } from '../incoming-packet';
import { Player } from '../../world/actor/player/player';
import { inputCommandAction } from '../../world/actor/player/action/input-command-action';
import { ByteBuffer } from '@runejs/byte-buffer';

export const commandPacket: incomingPacket = (player: Player, packetId: number, packetSize: number, packet: ByteBuffer): void => {
    const input = packet.getString();

    if (!input || input.trim().length === 0) {
        return;
    }
    const isConsole = packetId == 246;

    const args = input.trim().split(' ');
    const command = args[0];

    args.splice(0, 1);

    inputCommandAction(player, command, isConsole, args);
};
