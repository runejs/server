import { commandAction } from '@server/world/action/player-command-action';
import { Position } from '@server/world/position';

const action: commandAction = (details) => {
    const { player, args } = details;

    const x: number = args.x as number;
    const y: number = args.y as number;
    const pathingDiameter: number = args.diameter as number;

    player.pathfinding.walkTo(new Position(x, y, player.position.level), { pathingSearchRadius: pathingDiameter });
};

export default {
    type: 'player_command',
    commands: [ 'path' ],
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
            name: 'diameter',
            type: 'number',
            defaultValue: 64
        }
    ],
    action
};
