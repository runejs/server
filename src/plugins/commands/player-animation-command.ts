import { commandActionHandler } from '@engine/world/action/player-command.action';

const action: commandActionHandler = (details) => {
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
    handler: action
};
