import { commandActionHandler } from '@engine/action';

const kmsAction: commandActionHandler = (details) => {
    const { player, args } = details;
    player.skills.hitpoints.level = 1;
};

export default {
    pluginId: 'rs:kms_command',
    hooks: [
        {
            type: 'player_command',
            commands: 'kms',
            handler: kmsAction,
        },
    ],
};
