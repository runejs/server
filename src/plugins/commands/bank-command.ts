import { commandActionHandler } from '@engine/world/action/player-command.action';
import { openBankInterface } from '@plugins/objects/bank/bank-plugin';

const action: commandActionHandler = (details) => {
    openBankInterface(details as any);
};

export default {
    type: 'player_command',
    commands: [ 'bank' ],
    handler: action
};
