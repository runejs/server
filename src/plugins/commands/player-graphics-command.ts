import { commandAction } from '@server/world/action/player-command-action';

const action: commandAction = (details) => {
    const { player, args } = details;

    const graphicsId: number = args.graphicsId as number;
    const height: number = args.height as number;

    player.playGraphics({ id: graphicsId, delay: 0, height: height });
};

export default {
    type: 'player_command',
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
};
