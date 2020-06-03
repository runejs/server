import { ActionType, RunePlugin } from '@server/plugins/plugin';
import { commandAction } from '@server/world/actor/player/action/input-command-action';
import { world } from '@server/game-server';

const action: commandAction = (details) => {
    const { player, args } = details;

    const locationObjectId = args.locationObjectId as number;
    const objectType = args.objectType as number;
    const objectOrientation = args.objectOrientation as number;

    const position = player.position.copy();

    world.addLocationObject({
        objectId: locationObjectId,
        x: position.x,
        y: position.y,
        level: position.level,
        type: objectType,
        orientation: objectOrientation
    }, position);
};

export default new RunePlugin({
    type: ActionType.COMMAND,
    commands: [ 'scene', 'sc' ],
    args: [
        {
            name: 'locationObjectId',
            type: 'number'
        },
        {
            name: 'objectType',
            type: 'number',
            defaultValue: 10
        },
        {
            name: 'objectOrientation',
            type: 'number',
            defaultValue: 0
        }
    ],
    action
});
