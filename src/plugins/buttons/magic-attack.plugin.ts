
import { Player } from '@engine/world/actor/player/player';
import { Position } from '@engine/world/position';
import { animationIds } from '@engine/world/config/animation-ids';
import { soundIds } from '@engine/world/config/sound-ids';
import { gfxIds } from '@engine/world/config/gfx-ids';
import { loopingEvent } from '@engine/game-server';
import { TaskExecutor } from '@engine/world/action';
import { widgetButtonIds } from '../skills/smithing/smelting-constants';
import { magic_on_npcActionHandler, Magic_on_NPCActionHook, Magic_on_NPCAction } from '../../game-engine/world/action/magic-on-npc.action';

const buttonIds: number[] = [
    0, // Home Teleport
];

function attack_target(player: Player, elapsedTicks: number): boolean {
    console.log("attacking?");
    return true;
}

const spells = ["Wind Strike","Confuse", "Water Strike","unknown?", "Earth Strike"];
export const activate = (task: TaskExecutor<Magic_on_NPCAction>, elapsedTicks: number = 0) => {
    const {
        npc,
        player,
        widgetId,
        buttonId
    } = task.actionData;

    console.info(`${player.username} smites ${npc.name} with ${spells[buttonId]}`);
};

export default {
    pluginId: 'rs:magic',
    hooks: 
        {
            type: 'magic_on_npc',
            widgetId: 192,
            buttonIds: buttonIds,
            task: {
                activate,
                interval: 0
            }
        } as Magic_on_NPCActionHook
    
};
