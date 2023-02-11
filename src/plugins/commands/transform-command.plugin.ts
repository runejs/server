import { commandActionHandler, PlayerCommandActionHook } from '@engine/action';

const action: commandActionHandler = (details) => {
    const { player } = details;

    player.transformInto(details && details.args ? details.args['npcKey'] : null)
};

export default {
    pluginId: 'rs:transform_command',
    hooks: [
        {
            type: 'player_command',
            commands: [ 'transform' ],
            args: [
                {
                    name: 'npcKey',
                    type: 'either',
                    defaultValue: null
                }
            ],
            handler: action
        } as PlayerCommandActionHook
    ]
};
