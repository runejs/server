import { widgetAction } from '@server/world/action/widget-action';

/**
 * Handles an item selection dialogue choice.
 */
export const action: widgetAction = (details) => {
    const { player, widgetId, childId } = details;
    player.interfaceState.closeWidget(widgetId, childId);
};

export default { type: 'widget_action', widgetIds: [ 303, 304, 305, 306, 307, 309 ], action, cancelActions: false };
