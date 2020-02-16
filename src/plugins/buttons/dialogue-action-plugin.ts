import { buttonAction, ButtonActionPlugin } from '@server/world/mob/player/action/button-action';

const dialogueActions: { [key: number]: number } = {
    2494: 1, 2495: 2, 2496: 3, 2497: 4, 2498: 5,
    2482: 1, 2483: 2, 2484: 3, 2485: 4,
    2471: 1, 2472: 2, 2473: 3,
    2461: 1, 2462: 2
};

const buttonIds = Object.keys(dialogueActions).map(Number);

export const action: buttonAction = (details) => {
    const { player, buttonId } = details;
    player.dialogueInteractionEvent.next(dialogueActions[buttonId]);
};

export default { buttonIds, action } as ButtonActionPlugin;
