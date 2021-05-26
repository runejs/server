import { NpcInteractionAction, npcInteractionActionHandler } from '@engine/world/action/npc-interaction.action';
import { Actor } from '@engine/world/actor/actor';
import { Player } from '@engine/world/actor/player/player';
import { lastValueFrom, timer } from 'rxjs';
import { World } from '@engine/world';
import { filter, take } from 'rxjs/operators';
import { animationIds } from '@engine/world/config/animation-ids';
import { Npc } from '@engine/world/actor/npc/npc';
import { world } from '@engine/game-server';
import { itemIds } from '@engine/world/config/item-ids';
import { soundIds } from '@engine/world/config/sound-ids';
import { findNpc } from '@engine/config';
import EventEmitter from 'events';
import { logger } from '@runejs/core';
import { TaskExecutor } from '../../game-engine/world/action';
import { wait } from '../../game-engine/world/task';
import { Behavior, BehaviorType } from '../../game-engine/world/actor/behaviors/behavior';


export const activate = async (task: TaskExecutor<NpcInteractionAction>, elapsedTicks: number = 0) => {
    const { player, npc, position, option } = task.actionData;

    //Kicking off combat - all subsequent action will be handed off to behaviors
    console.log(`Kicking off combat - all subsequent action will be handed off to behaviors`);
    npc.Behaviors.filter(a => a.Type == BehaviorType.Combat).forEach(async function (combatBehavior) {
        console.log(`initting ${combatBehavior.Name}`);
        await combatBehavior.init(npc, player);
        npc.inCombat = true;
    });
    player.Behaviors.filter(a => a.Type == BehaviorType.Combat).forEach(async function (combatBehavior) {
        console.log(`initting ${combatBehavior.Name}`);
        await combatBehavior.init(player, npc);
        player.inCombat = true;
    });
    await task.stop();
};


export default {
    pluginId: 'rs:combat',
    hooks: [
        {
            type: 'npc_interaction',
            options: 'attack',
            walkTo: false,
            task: {
                activate,
            }
        }
    ]
};