import { commandActionHandler } from '@engine/action';
import { activeWorld } from '@engine/world';
import { Position } from '@engine/world/position';

const action: commandActionHandler = (details) => {
    const { player, args } = details;

    const x = args.XorPlayerName;

    if(typeof x === 'string') {
        const playerWithName = activeWorld.findPlayer(x);
        if(playerWithName) {
            player.teleport(playerWithName.position);
            return;
        }
    }

    const xCoord: number = typeof x === 'string' ? parseInt(x, 10) : x;

    if(isNaN(xCoord)) {
        return;
    }
    const y: number = args.y as number;
    const level: number = args.level as number;

    player.teleport(new Position(xCoord, y, level));
};

export default {
    pluginId: 'rs:teleport_command_plugin',
    hooks: [
        {
            type: 'player_command',
            commands: [ 'move', 'goto', 'teleport', 'tele', 'moveto', 'setpos' ],
            args: [
                {
                    name: 'XorPlayerName',
                    type: 'string'
                },
                {
                    name: 'y',
                    type: 'number',
                    defaultValue: 3222
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
