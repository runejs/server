import { ActionType, RunePlugin } from '@server/plugins/plugin';
import { commandAction } from '@server/world/actor/player/action/input-command-action';
import { openBankInterface } from '@server/plugins/objects/bank/bank-plugin';

const action: commandAction = (details) => {
    openBankInterface(details as any);
};

export default new RunePlugin({
    type: ActionType.COMMAND,
    commands: [ 'bank' ],
    action
});
