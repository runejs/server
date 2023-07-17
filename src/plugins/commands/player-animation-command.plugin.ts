import { commandActionHandler, PlayerCommandActionHook } from '@engine/action';

const action: commandActionHandler = (details): void => {
    const { player, args } = details;

    const animationId: number = args.animationId as number;
    player.playAnimation(animationId);
};

export default {
    pluginId: 'rs:player_animation_command',
    hooks: [
        {
            type: 'player_command',
            commands: [ 'anim', 'animation', 'playanim' ],
            args: [
                {
                    name: 'animationId',
                    type: 'number'
                }
            ],
            handler: action
        } as PlayerCommandActionHook
    ]
};
