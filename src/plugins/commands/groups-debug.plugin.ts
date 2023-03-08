import { commandActionHandler } from '@engine/action';
import { findItemTagsInGroups, findItemTagsInGroupFilter } from '@engine/config/config-handler';

const selectGroups: commandActionHandler = ({ player, args, isConsole }) => {
    const groups: string | number = args.groupkeys;
    if(!groups || typeof groups !== 'string') {
        player.sendLogMessage('invalid input', isConsole);
        return;
    }
    player.sendLogMessage('results:', isConsole);
    findItemTagsInGroups(groups.split(',')).forEach((itemName) => {
        player.sendLogMessage(itemName, isConsole);
    });
    return;
};

const filterGroups: commandActionHandler = ({ player, args, isConsole }) => {
    const groups: string | number = args.groupkeys;
    if(!groups || typeof groups !== 'string') {
        player.sendLogMessage('invalid input', isConsole);
        return;
    }

    player.sendLogMessage('results:', isConsole);
    findItemTagsInGroupFilter(groups.split(',')).forEach((itemName) => {
        player.sendLogMessage(itemName, isConsole);
    });
    return;
};

export default {
    pluginId: 'promises:groups-debug',
    hooks: [
        {
            type: 'player_command',
            commands: [ 'selectgroups' ],
            args: [
                {
                    name: 'groupkeys',
                    type: 'string'
                }
            ],
            handler: selectGroups
        },
        {
            type: 'player_command',
            commands: [ 'filtergroups' ],
            args: [
                {
                    name: 'groupkeys',
                    type: 'string'
                }
            ],
            handler: filterGroups
        }
    ]
};
