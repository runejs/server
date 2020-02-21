import { ActionType, RunePlugin } from '@server/plugins/plugin';
import { commandAction } from '@server/world/mob/player/action/input-command-action';

const action: commandAction = (details) => {
    const { player, args } = details;

    const animationId: number = args.animationId as number;
    player.playAnimation(animationId);
};

export default new RunePlugin({
    type: ActionType.COMMAND,
    commands: [ 'anim', 'animation', 'playanim' ],
    args: [
        {
            name: 'animationId',
            type: 'number'
        }
    ],
    action
});
