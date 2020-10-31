import { widgetAction } from '@server/world/actor/player/action/widget-action';

/**
 * Handles an item selection dialogue choice.
 */
export const action: widgetAction = (details) => {
    const { player, childId } = details;
    player.dialogueInteractionEvent.next(childId);
};

export default { type: 'widget_action', widgetIds: [ 303, 304, 305, 306, 307, 309 ], action, cancelActions: false };
