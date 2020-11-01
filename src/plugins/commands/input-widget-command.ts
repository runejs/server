import { commandAction } from '@server/world/action/player-command-action';

const action: commandAction = (details) => {
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
    action
};
