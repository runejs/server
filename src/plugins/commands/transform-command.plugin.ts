import type { PlayerCommandActionHook, commandActionHandler } from '@engine/action/pipe/player-command.action';

const action: commandActionHandler = details => {
    const { player, args } = details;

    player.transformInto(details && args ? args['npcKey'] : null);
};

export default {
    pluginId: 'rs:transform_command',
    hooks: [
        {
            type: 'player_command',
            commands: ['transform'],
            args: [
                {
                    name: 'npcKey',
                    type: 'either',
                    defaultValue: undefined,
                },
            ],
            handler: action,
        } as PlayerCommandActionHook,
    ],
};
