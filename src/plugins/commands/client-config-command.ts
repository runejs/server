import { ActionType, RunePlugin } from '@server/plugins/plugin';
import { commandAction } from '@server/world/actor/player/action/input-command-action';

const action: commandAction = (details) => {
    const { player, args } = details;

    const configId = args.configId as number;
    const configValue = args.configValue as number;

    player.outgoingPackets.updateClientConfig(configId, configValue);
};

export default new RunePlugin({
    type: ActionType.COMMAND,
    commands: [ 'config', 'conf' ],
    args: [
        {
            name: 'configId',
            type: 'number'
        },
        {
            name: 'configValue',
            type: 'number'
        }
    ],
    action
});
