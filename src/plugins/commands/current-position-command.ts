import { commandAction } from '@server/world/action/player-command-action';

const action: commandAction = (details) => {
    const { player } = details;
    player.sendLogMessage(`@[ ${player.position.x}, ${player.position.y}, ${player.position.level} ]`, details.isConsole);
};

export default {
    type: 'player_command',
    commands: [ 'pos', 'loc', 'position', 'location', 'coords', 'coordinates', 'mypos', 'myloc' ],
    action
};
