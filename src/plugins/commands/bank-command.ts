import { commandAction } from '@engine/world/action/player-command-action';
import { openBankInterface } from '@plugins/objects/bank/bank-plugin';

const action: commandAction = (details) => {
    openBankInterface(details as any);
};

export default {
    type: 'player_command',
    commands: [ 'bank' ],
    action
};
