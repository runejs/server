import { commandAction } from '@server/world/action/player-command-action';

const action: commandAction = (details) => {
    const { player, args } = details;

    const widgetId: number = args.widgetId as number;
    const secondaryWidgetId: number = args.secondaryWidgetId as number;

    if(secondaryWidgetId === 1) {
        player.interfaceState.openWidget(widgetId, {
            slot: 'screen'
        });
    } else {
        player.interfaceState.openWidget(widgetId, {
            slot: 'screen',
            multi: true
        });
        player.interfaceState.openWidget(secondaryWidgetId, {
            slot: 'tabarea',
            multi: true
        });
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
