import { buttonAction } from '@server/world/actor/player/action/button-action';
import { ActionType, RunePlugin } from '@server/plugins/plugin';

export const action: buttonAction = (details) => {
    const { player } = details;
    player.logout();
};

export default new RunePlugin({ type: ActionType.BUTTON, widgetId: 182, buttonIds: 6, action });
