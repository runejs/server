import { commandActionHandler } from '@engine/world/action/player-command.action';
import { openBankInterface } from '@plugins/objects/bank/bank.plugin';

const action: commandActionHandler = (details) => {
    openBankInterface(details as any);
};

export default {
    pluginId: 'rs:bank_command',
    hooks: [
        {
            type: 'player_command',
            commands: [ 'bank' ],
            handler: action
        }
    ]
};
