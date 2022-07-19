import { commandActionHandler } from '@engine/action';

const action: commandActionHandler = (details) => {
    const { player } = details;
    player.sendLogMessage(`@[ ${player.position.x}, ${player.position.y}, ${player.position.level} ]`, details.isConsole);
};

export default {
    pluginId: 'rs:current_position_command',
    hooks: [
        {
            type: 'player_command',
            commands: [ 'pos', 'loc', 'position', 'location', 'coords', 'coordinates', 'mypos', 'myloc' ],
            handler: action
        }
    ]
};
