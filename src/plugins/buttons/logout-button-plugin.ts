import { buttonAction } from '@server/world/actor/player/action/button-action';
import { ActionType, RunePlugin } from '@server/plugins/plugin';
import { widgets } from '@server/world/config/widget';

export const action: buttonAction = (details) => {
    const { player } = details;
    player.logout();
};

export default new RunePlugin({ type: ActionType.BUTTON, widgetId: widgets.logoutTab, buttonIds: 6, action });
