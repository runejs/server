import { widgetInteractionActionHandler } from '@engine/world/action/widget-interaction.action';

const dialogueIds = [
    64, 65, 66, 67, 241,
    242, 243, 244, 228, 230,
    232, 234,
    210, 211, 212, 213, 214,
];

/**
 * Handles a basic NPC/Player/Option/Text dialogue choice/action.
 */
export const action: widgetInteractionActionHandler = (details) => {
    const { player, widgetId, childId } = details;
    player.interfaceState.closeWidget('chatbox', widgetId, childId);
};

export default {
    pluginId: 'rs:dialog_choice',
    hooks: [
        {
            type: 'widget_interaction',
            widgetIds: dialogueIds,
            handler: action,
            cancelActions: true
        }
    ]
};
