import { ActionType, RunePlugin } from '@server/plugins/plugin';
import { commandAction } from '@server/world/actor/player/action/input-command-action';
import { Position } from '@server/world/position';

const action: commandAction = (details) => {
    const { player, args } = details;

    const x: number = args.x as number;
    const y: number = args.y as number;
    const pathingDiameter: number = args.diameter as number;

    player.pathfinding.walkTo(new Position(x, y, player.position.level), { pathingSearchRadius: pathingDiameter });
};

export default new RunePlugin({
    type: ActionType.COMMAND,
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
});
