import { ActionType, RunePlugin } from '@server/plugins/plugin';
import { commandAction } from '@server/world/actor/player/action/input-command-action';
import { world } from '@server/game-server';
import { TravelLocation } from '@server/world/config/travel-locations';

const action: commandAction = (details) => {
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

export default new RunePlugin({
    type: ActionType.COMMAND,
    commands: [ 'travel' ],
    args: [
        {
            name: 'search',
            type: 'string'
        }
    ],
    action
});
