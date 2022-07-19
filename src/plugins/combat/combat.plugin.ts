import { NpcInteractionAction, TaskExecutor } from '@engine/action';
import { BehaviorType } from '@engine/world/actor/behaviors';


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
