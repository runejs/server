import { commandActionHandler } from '@engine/action';

const action: commandActionHandler = (details) => {
    const { player, args } = details;

    const configId = args.configId as number;
    const configValue = args.configValue as number;

    player.outgoingPackets.updateClientConfig(configId, configValue);
};

export default {
    pluginId: 'rs:client_config_command',
    hooks: [
        {
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
            handler: action
        }
    ]
};
