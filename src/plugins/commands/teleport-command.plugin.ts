import { commandActionHandler } from '@engine/action';
import { Position } from '@engine/world/position';

const action: commandActionHandler = (details) => {
    const { player, args } = details;

    const x: number = args.x as number;
    const y: number = args.y as number;
    const level: number = args.level as number;

    player.teleport(new Position(x, y, level));
};

export default {
    pluginId: 'rs:teleport_command_plugin',
    hooks: [
        {
            type: 'player_command',
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
            handler: action
        }
    ]
};
