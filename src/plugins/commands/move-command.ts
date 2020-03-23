import { ActionType, RunePlugin } from '@server/plugins/plugin';
import { commandAction } from '@server/world/actor/player/action/input-command-action';
import { Position } from '@server/world/position';

const action: commandAction = (details) => {
    const { player, args } = details;

    const x: number = args.x as number;
    const y: number = args.y as number;
    const level: number = args.level as number;

    player.teleport(new Position(x, y, level));
};

export default new RunePlugin({
    type: ActionType.COMMAND,
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
});
