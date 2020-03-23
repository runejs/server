import { ActionType, RunePlugin } from '@server/plugins/plugin';
import { widgetAction } from '@server/world/actor/player/action/widget-action';

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
    const { player, childId } = details;
    player.dialogueInteractionEvent.next(childId);
};

export default new RunePlugin({ type: ActionType.WIDGET_ACTION, widgetIds: dialogueIds, action, cancelActions: true });
