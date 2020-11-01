import { commandAction } from '@server/world/action/player-command-action';

const action: commandAction = (details) => {
    const { player, args } = details;

    const configId = args.configId as number;
    const configValue = args.configValue as number;

    player.outgoingPackets.updateClientConfig(configId, configValue);
};

export default {
    type: 'player_command',
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
};
