import { buttonAction } from '@server/world/mob/player/action/button-action';
import { ActionType, RunePlugin } from '@server/plugins/plugin';

export const action: buttonAction = (details) => {
    const { player } = details;
    player.logout();
};

export default new RunePlugin({ type: ActionType.BUTTON, buttonIds: 2458, action });
