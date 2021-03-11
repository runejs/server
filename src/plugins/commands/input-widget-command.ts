import { commandActionHandler } from '@engine/world/action/player-command.action';

const action: commandActionHandler = (details) => {
    const { player, args } = details;

    const type: number = args.type as number;

    if(type === 1) {
        player.outgoingPackets.showNumberInputDialogue();
    } else if(type === 2) {
        player.outgoingPackets.showTextInputDialogue();
    }
};

export default {
    type: 'player_command',
    commands: [ 'input' ],
    args: [
        {
            name: 'type',
            type: 'number'
        }
    ],
    handler: action
};
