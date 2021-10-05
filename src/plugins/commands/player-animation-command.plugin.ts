import { commandActionHandler, PlayerCommandAction } from '@engine/action';
import { Player } from '@engine/world/actor/player/player';
import { loopingEvent } from '@engine/plugins';

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
        },
        {
            type: 'player_command',
            commands: [ 'yeet' ],
            handler: ({ player }: PlayerCommandAction): void => {
                loopingEvent({ ticks: 3, player })
                    .event.asObservable().subscribe(() => (player as Player).playAnimation(866))
            }
        }
    ]
};
