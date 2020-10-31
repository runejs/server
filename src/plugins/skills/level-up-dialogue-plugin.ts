import { widgetAction } from '@server/world/actor/player/action/widget-action';
import { ActionType, RunePlugin } from '@server/plugins/plugin';

const widgetIds = [
    158, 161, 175,
    167, 171, 170,
    168, 159, 177,
    165, 164, 163,
    160, 174, 169,
    166, 157, 176,
    173, 162, 172,
];

/**
 * Handles a level-up dialogue action.
 */
export const action: widgetAction = (details) => {
    const { player } = details;
    player.closeActiveWidgets();
};

export default { type: 'widget_action', widgetIds, action, cancelActions: false };
