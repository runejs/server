import { ActionType, RunePlugin } from '@server/plugins/plugin';
import { widgetAction } from '@server/world/actor/player/action/widget-action';

const dialogueIds = [
    64, 65, 66, 67, 241,
    242, 243, 244, 228, 230,
    232, 234,
    158, 161, 175,
    167, 171, 170,
    168, 159, 177,
    165, 164, 163,
    160, 174, 169,
    166, 157, 176,
    173, 162, 172,
];

/**
 * Handles a basic NPC/Player/Option/level-up dialogue choice/action.
 */
export const action: widgetAction = (details) => {
    const { player, childId } = details;
    player.dialogueInteractionEvent.next(childId);
};

export default new RunePlugin({ type: ActionType.WIDGET_ACTION, widgetIds: dialogueIds, action, cancelActions: true });
