import { inputCommandAction } from '../../world/actor/player/action/input-command-action';
import { Rights } from '../../world/actor/player/player';

const commandPacket = (player, packet) => {
    const input = packet.buffer.getString();

    if(!input || input.trim().length === 0) {
        return;
    }

    const isConsole = packet.opcode === 246;

    const args = input.trim().split(' ');
    const command = args[0];

    args.splice(0, 1);
    if(player.rights !== Rights.ADMIN) {
        player.sendLogMessage('You need to be an administrator to use commands.', isConsole);
    } else {
        inputCommandAction(player, command, isConsole, args);
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
