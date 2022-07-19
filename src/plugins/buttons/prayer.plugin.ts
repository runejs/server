import { TaskExecutor, PrayerAction, PrayerActionHook } from '@engine/action';
import { widgets } from '@engine/config';
import { prayers } from '@engine/world/config';
const buttonIds: number[] = [
    0, // Home Teleport
    1,
    2,
    36,
    38,
    3
];


export const activate = (task: TaskExecutor<PrayerAction>, elapsedTicks: number = 0) => {
    const {
        player,
        widgetId,
        buttonId
    } = task.actionData;

    prayers.filter(a => a.ButtonId == buttonId).forEach((prayer) => {
        player.playAnimation(prayer.AnimationId);
        player.playSound(prayer.SoundId);
        player.effects.push(prayer);
    });

    console.log(`${player.username} casts ${prayers[buttonId]}`);

};

export default {
    pluginId: 'rs:prayer',
    hooks:
        {
            type: 'button',
            widgetId: widgets.prayerTab,
            buttonIds: buttonIds,
            task: {
                activate,
                interval: 0
            }
        } as PrayerActionHook
};
