import { commandAction } from '@server/world/action/player-command-action';

const action: commandAction = (details) => {
    const { player, args } = details;

    const widgetId: number = args.widgetId as number;
    const secondaryWidgetId: number = args.secondaryWidgetId as number;

    if(secondaryWidgetId === 1) {
        player.activeWidget = {
            type: 'SCREEN',
            widgetId,
            closeOnWalk: true
        };
    } else {
        player.activeWidget = {
            type: 'SCREEN_AND_TAB',
            widgetId,
            secondaryWidgetId,
            closeOnWalk: true
        };
    }
};

export default {
    type: 'player_command',
    commands: [ 'widget' ],
    args: [
        {
            name: 'widgetId',
            type: 'number'
        },
        {
            name: 'secondaryWidgetId',
            type: 'number',
            defaultValue: 1
        }
    ],
    action
};
