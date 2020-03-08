import { ActionType, RunePlugin } from '@server/plugins/plugin';
import { commandAction } from '@server/world/actor/player/action/input-command-action';

const action: commandAction = (details) => {
    const { player, args } = details;

    const graphicsId: number = args.graphicsId as number;
    const height: number = args.height as number;

    player.playGraphics({id: graphicsId, delay: 0, height: height});
};

export default new RunePlugin({
    type: ActionType.COMMAND,
    commands: [ 'gfx', 'graphics'],
    args: [
        {
            name: 'graphicsId',
            type: 'number'
        },
        {
            name: 'height',
            type: 'number',
            defaultValue: 120
        }
    ],
    action
});
