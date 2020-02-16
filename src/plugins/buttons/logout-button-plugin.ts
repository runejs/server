import { buttonAction, ButtonActionPlugin } from '@server/world/mob/player/action/button-action';

export const action: buttonAction = (details) => {
    const { player } = details;
    player.logout();
};

export default { buttonIds: 2458, action } as ButtonActionPlugin;
