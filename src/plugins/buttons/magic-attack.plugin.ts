
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

const buttonIds: number[] = [
    0, // Home Teleport
];

function attack_target(player: Player, elapsedTicks: number): boolean {
    logger.info('attacking?');
    return true;
}

const spells = ['Wind Strike','Confuse', 'Water Strike','unknown?', 'Earth Strike'];
export const activate = (task: TaskExecutor<MagicOnNPCAction>, elapsedTicks: number = 0) => {
    const {
        npc,
        player,
        widgetId,
        buttonId
    } = task.actionData;

    const attackerX = player.position.x;
    const attackerY = player.position.y
    const victimX = npc.position.x
    const victimY = npc.position.y;
    const offsetX = ((victimY - attackerY));
    const offsetY = ((victimX - attackerX));

    //https://oldschool.runescape.wiki/w/Attack_range#:~:text=All%20combat%20magic%20spells%20have,also%20allow%20longrange%20attack%20style
    // range should be within 10 tiles for magic
    // range should be within 7 for magic staff

    //npc world index would be -1 for players
    player.outgoingPackets.sendProjectile(player.position, offsetX, offsetY, 250, 40, 36, 100, npc.worldIndex + 1, 1); 
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
        } as MagicOnNPCActionHook
    
};
