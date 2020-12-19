import { widgetAction } from '@server/world/action/widget-action';

const dialogueIds = [
    64, 65, 66, 67, 241,
    242, 243, 244, 228, 230,
    232, 234,
    210, 211, 212, 213, 214,
];

/**
 * Handles a basic NPC/Player/Option/Text dialogue choice/action.
 */
export const action: widgetAction = (details) => {
    const { player, widgetId, childId } = details;
    player.interfaceState.closeWidget(widgetId, childId);
};

export default { type: 'widget_action', widgetIds: dialogueIds, action, cancelActions: true };
