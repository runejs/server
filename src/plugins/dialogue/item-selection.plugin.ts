import { widgetInteractionActionHandler } from '@engine/world/action/widget-interaction.action';

/**
 * Handles an item selection dialogue choice.
 */
export const action: widgetInteractionActionHandler = (details) => {
    const { player, widgetId, childId } = details;
    player.interfaceState.closeWidget('chatbox', widgetId, childId);
};

export default {
    pluginId: 'rs:item_selection_choice',
    hooks: [
        {
            type: 'widget_interaction',
            widgetIds: [ 303, 304, 305, 306, 307, 309 ],
            handler: action,
            cancelActions: false
        }
    ]
};
