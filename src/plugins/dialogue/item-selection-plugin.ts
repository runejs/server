import { widgetInteractionActionHandler } from '@engine/world/action/widget-interaction.action';

/**
 * Handles an item selection dialogue choice.
 */
export const action: widgetInteractionActionHandler = (details) => {
    const { player, widgetId, childId } = details;
    player.interfaceState.closeWidget(widgetId, childId);
};

export default { type: 'widget_interaction', widgetIds: [ 303, 304, 305, 306, 307, 309 ], handler: action, cancelActions: false };
