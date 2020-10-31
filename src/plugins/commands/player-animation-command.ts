import { commandAction } from '@server/world/action/input-command-action';

const action: commandAction = (details) => {
    const { player, args } = details;

    const animationId: number = args.animationId as number;
    player.playAnimation(animationId);
};

export default {
    type: 'player_command',
    commands: [ 'anim', 'animation', 'playanim' ],
    args: [
        {
            name: 'animationId',
            type: 'number'
        }
    ],
    action
};
