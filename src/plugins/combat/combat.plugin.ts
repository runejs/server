import { NpcInteractionAction, npcInteractionActionHandler } from '@engine/action';
import { Actor } from '@engine/world/actor/actor';
import { Player } from '@engine/world/actor/player/player';
import { lastValueFrom, timer } from 'rxjs';
import { World } from '@engine/world';
import { filter, take } from 'rxjs/operators';
import { animationIds } from '@engine/world/config/animation-ids';
import { Npc } from '@engine/world/actor/npc';
import { itemIds } from '@engine/world/config/item-ids';
import { soundIds } from '@engine/world/config/sound-ids';
import { findNpc } from '@engine/config/config-handler';
import EventEmitter from 'events';
import { logger } from '@runejs/core';
import { TaskExecutor } from '@engine/action/action-pipeline';
import { wait } from '../../engine/world/task';
import { Behavior, BehaviorType } from '../../engine/world/actor/behaviors/behavior';
import { activeWorld } from '@engine/world';


//Kicking off combat - all subsequent action will be handed off to behaviors
export const activate = async (task: TaskExecutor<NpcInteractionAction>, elapsedTicks: number = 0) => {
    const { player, npc, position, option } = task.actionData;
    
    console.log(`Kicking off combat - all subsequent action will be handed off to behaviors`);

    npc.npcEvents.on('combatStart', (npc, player) => {
        //this is for NPC - if it has MULTIPLE combat behaviors it will activate them all (which is the point)
        npc.Behaviors.filter(a => a.Type == BehaviorType.Combat).forEach(async function (combatBehavior) {
            console.log(`initting ${combatBehavior.Name}`);
            await combatBehavior.init(npc, player);
            npc.inCombat = true;
        });
    });
    
    player.playerEvents.on('combatStart', (player, npc) => {
        //this is for auto attack for a player - later on if they are mind controlled or confused or even scripted this would be for that too
        player.Behaviors.filter(a => a.Type == BehaviorType.Combat).forEach(async function (combatBehavior) {
            console.log(`initting ${combatBehavior.Name}`);
            await combatBehavior.init(player, npc);
            player.inCombat = true;
        });
    })

    player.playerEvents.emit('combatStart', player, npc);
    npc.npcEvents.emit('combatStart', npc, player);
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
