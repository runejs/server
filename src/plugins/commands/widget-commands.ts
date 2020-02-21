import { ActionType, RunePlugin } from '@server/plugins/plugin';
import { commandAction } from '@server/world/mob/player/action/input-command-action';

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

export default new RunePlugin({
    type: ActionType.COMMAND,
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
});
