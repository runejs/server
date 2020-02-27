import { buttonAction } from '@server/world/actor/player/action/button-action';
import { ActionType, RunePlugin } from '@server/plugins/plugin';
import { widgetIds } from '@server/world/config/widget';

export const action: buttonAction = (details) => {
    const { player } = details;
    player.logout();
};

export default new RunePlugin({ type: ActionType.BUTTON, widgetId: widgetIds.logoutTab, buttonIds: 6, action });
