import { commandActionHandler } from '@engine/action';

const posAction: commandActionHandler = (details) => {
    const { player, args } = details;
    player.sendMessage(`${player.position}`)
};

export default {
    pluginId: 'rs:pos_command',
    hooks: [
        {
            type: 'player_command',
            commands: 'pos',
            handler: posAction,
        },
    ],
};
