import { widgetInteractionActionHandler } from '@engine/world/action/widget-interaction.action';
import {
    continuableTextWidgetIds,
    itemWidgetIds,
    npcWidgetIds,
    optionWidgetIds,
    playerWidgetIds
} from '@engine/world/actor/dialogue';

const dialogueIds = [
    ...playerWidgetIds,
    ...npcWidgetIds,
    ...optionWidgetIds,
    ...continuableTextWidgetIds,
    ...itemWidgetIds
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
