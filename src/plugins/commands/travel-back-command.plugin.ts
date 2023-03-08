import { commandActionHandler } from '@engine/action';
import { Skill } from '@engine/world/actor/skills';

const action: commandActionHandler = (details) => {
    const { player } = details;

    if (player.metadata.lastPosition) {
        player.teleport(player.metadata.lastPosition);
    }
};

export default {
    pluginId: 'rs:travel_back_command',
    hooks: [
        {
            type: 'player_command',
            commands: [ 'back' ],
            handler: action
        }
    ]
};
