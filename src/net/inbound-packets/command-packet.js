import { inputCommandAction } from '../../world/actor/player/action/input-command-action';

const commandPacket = (player, packet) => {
    const input = packet.buffer.getString();

    if(!input || input.trim().length === 0) {
        return;
    }

    const isConsole = packet.opcode === 246;

    const args = input.trim().split(' ');
    const command = args[0];

    args.splice(0, 1);

    inputCommandAction(player, command, isConsole, args);
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
