import { ActionType, RunePlugin } from '@server/plugins/plugin';
import { commandAction } from '@server/world/actor/player/action/input-command-action';

const action: commandAction = (details) => {
    const { player, args } = details;

    const type: number = args.type as number;

    if(type === 1) {
        player.outgoingPackets.showNumberInputDialogue();
    } else if(type === 2) {
        player.outgoingPackets.showTextInputDialogue();
    }
};

export default new RunePlugin({
    type: ActionType.COMMAND,
    commands: [ 'input' ],
    args: [
        {
            name: 'type',
            type: 'number'
        }
    ],
    action
});
