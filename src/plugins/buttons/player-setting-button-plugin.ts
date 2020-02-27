import { buttonAction } from '@server/world/actor/player/action/button-action';
import { ActionType, RunePlugin } from '@server/plugins/plugin';

const buttonIds: number[] = [
    0, // walk/run
    11, 12, 13, 14, 15, // music volume
    16, 17, 18, 19, 20, // sound effect volume
    2, // split private chat
    3, // mouse buttons
    7, 8, 9, 10, // screen brightness
    1, // chat effects
    4, // accept aid
    5, // house options
];

export const action: buttonAction = (details) => {
    const { player, buttonId } = details;
    player.settingChanged(buttonId);
};

export default new RunePlugin({ type: ActionType.BUTTON, widgetId: 261, buttonIds: buttonIds, action });
