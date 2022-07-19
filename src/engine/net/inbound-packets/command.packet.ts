import { Player, Rights } from '@engine/world/actor';
import { PacketData } from '@engine/net';

const commandPacket = (player: Player, packet: PacketData) => {
    const input = packet.buffer.getString();

    if(!input || input.trim().length === 0) {
        return;
    }

    const isConsole = packet.packetId === 246;

    const args = input.trim().split(' ');
    const command = args[0];

    args.splice(0, 1);
    if(player.rights !== Rights.ADMIN) {
        player.sendLogMessage('You need to be an administrator to use commands.', isConsole);
    } else {
        player.actionPipeline.call('player_command', player, command, isConsole, args);
    }
};

export default [{
    opcode: 246,
    size: -3,
    handler: commandPacket
},{
    opcode: 248,
    size: -1,
    handler: commandPacket
}];
