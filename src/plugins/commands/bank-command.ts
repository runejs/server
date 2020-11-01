import { commandAction } from '@server/world/action/player-command-action';
import { openBankInterface } from '@server/plugins/objects/bank/bank-plugin';

const action: commandAction = (details) => {
    openBankInterface(details as any);
};

export default {
    type: 'player_command',
    commands: [ 'bank' ],
    action
};
