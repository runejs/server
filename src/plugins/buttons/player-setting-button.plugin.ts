import { buttonActionHandler } from '@engine/action/pipe/button.action';
import { widgets } from '@engine/config/config-handler';

const buttonIds: number[] = [
    0, // walk/run
    11, 12, 13, 14, 15, // music volume
    16, 17, 18, 19, 20, // sound effect volume
    29, 30, 31, 32, 33, // area effect volume
    2, // split private chat
    3, // mouse buttons
    7, 8, 9, 10, // screen brightness
    1, // chat effects
    4, // accept aid
    5, // house options
];

export const handler: buttonActionHandler = (details) => {
    const { player, buttonId } = details;
    player.settingChanged(buttonId);
};

export default {
    pluginId: 'rs:player_setting_button',
    hooks: [
        { type: 'button', widgetId: widgets.settingsTab, buttonIds: buttonIds, handler }
    ]
};
