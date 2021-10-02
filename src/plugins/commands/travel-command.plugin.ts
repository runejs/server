import { commandActionHandler } from '@engine/world/action/player-command.action';
import { TravelLocation } from '@engine/world/config/travel-locations';
import { world } from '@engine/world';

const action: commandActionHandler = (details) => {
    const { player, args } = details;

    const search: string = args.search as string;
    const location = world.travelLocations.find(search) as TravelLocation;

    if (location) {
        player.teleport(location.position);
        player.sendLogMessage(`Welcome to ${location.name}`, details.isConsole);
    } else {
        player.sendLogMessage(`Unknown location ${search}`, details.isConsole);
    }
};

export default {
    pluginId: 'rs:travel_command',
    hooks: [
        {
            type: 'player_command',
            commands: [ 'travel' ],
            args: [
                {
                    name: 'search',
                    type: 'string'
                }
            ],
            handler: action
        }
    ]
};
