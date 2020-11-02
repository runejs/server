import { commandAction } from '@server/world/action/player-command-action';
import { Position } from '@server/world/position';

const action: commandAction = (details) => {
    const { player, args } = details;

    const x: number = args.x as number;
    const y: number = args.y as number;
    const level: number = args.level as number;

    player.teleport(new Position(x, y, level));
};

export default {
    type: 'player_command',
    commands: [ 'move', 'goto', 'teleport', 'tele', 'moveto', 'setpos' ],
    args: [
        {
            name: 'x',
            type: 'number'
        },
        {
            name: 'y',
            type: 'number'
        },
        {
            name: 'level',
            type: 'number',
            defaultValue: 0
        }
    ],
    action
};
