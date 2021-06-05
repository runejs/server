import { Player } from '@engine/world/actor/player/player';
import { Position } from '@engine/world/position';
import { animationIds } from '@engine/world/config/animation-ids';
import { soundIds } from '@engine/world/config/sound-ids';
import { gfxIds } from '@engine/world/config/gfx-ids';
import { loopingEvent } from '@engine/game-server';
import { TaskExecutor } from '@engine/world/action';
import { widgetButtonIds } from '../skills/smithing/smelting-constants';
import { magiconnpcActionHandler, MagicOnNPCActionHook, MagicOnNPCAction } from '../../game-engine/world/action/magic-on-npc.action';
import { logger } from '@runejs/core';
import { PrayerActionHook } from '../../game-engine/world/action/prayer.action';
import { widgets } from '../../game-engine/config';
import { Prayer } from '../../game-engine/world/actor/prayer';
import { EffectType } from '../../game-engine/world/actor/effect';
import { prayers } from '../../game-engine/world/config/prayers'; 
const buttonIds: number[] = [
    0, // Home Teleport
    1,
    2,
    36,
    38,
    3
];


export const activate = (task: TaskExecutor<MagicOnNPCAction>, elapsedTicks: number = 0) => {
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
