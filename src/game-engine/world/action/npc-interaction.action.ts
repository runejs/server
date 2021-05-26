import { Player } from '@engine/world/actor/player/player';
import { Npc } from '@engine/world/actor/npc/npc';
import { Position } from '@engine/world/position';
import { ActionHook, getActionHooks } from '@engine/world/action/hooks';
import { playerWalkTo } from '@engine/game-server';
import { stringHookFilter, questHookFilter } from '@engine/world/action/hooks/hook-filters';
import { ActionPipe, RunnableHooks } from '@engine/world/action/index';


/**
 * Defines an npc action hook.
 */
export interface NpcInteractionActionHook extends ActionHook<NpcInteractionAction, npcInteractionActionHandler> {
    // A single NPC key or a list of NPC keys that this action applies to.
    npcs?: string | string[];
    // A single option name or a list of option names that this action applies to.
    options?: string | string[];
    // Whether or not the player needs to walk to this NPC before performing the action.
    walkTo: boolean;
}


/**
 * The npc action hook handler function to be called when the hook's conditions are met.
 */
export type npcInteractionActionHandler = (npcInteractionAction: NpcInteractionAction) => void;


/**
 * Details about an npc action being performed.
 */
export interface NpcInteractionAction {
    // The player performing the action.
    player: Player;
    // The NPC the action is being performed on.
    npc: Npc;
    // The position that the NPC was at when the action was initiated.
    position: Position;
    // The option used when interacting with the NPC
    option: string;
}


/**
 * The pipe that the game engine hands npc actions off to.
 * @param player
 * @param npc
 * @param position
 * @param option
 */
const npcInteractionActionPipe = (player: Player, npc: Npc, position: Position, option: string): RunnableHooks<NpcInteractionAction> => {
    if(player.busy) {
        return;
    }



    const morphedNpc = player.getMorphedNpcDetails(npc);

    // Find all NPC action plugins that reference this NPC
    let matchingHooks = getActionHooks<NpcInteractionActionHook>('npc_interaction')
        .filter(plugin => questHookFilter(player, plugin) &&
            (!plugin.npcs || stringHookFilter(plugin.npcs, morphedNpc?.key || npc.key)) &&
            (!plugin.options || stringHookFilter(plugin.options, option)));
    const questActions = matchingHooks.filter(plugin => plugin.questRequirement !== undefined);
    

    if(questActions.length !== 0) {
        matchingHooks = questActions;
    }

    if(matchingHooks.length === 0) {
        player.outgoingPackets.chatboxMessage(`Unhandled NPC interaction: ${option} ${morphedNpc?.key || npc.key} (id-${morphedNpc?.gameId || npc.id}) @ ${position.x},${position.y},${position.level}`);
        if (morphedNpc) {
            player.outgoingPackets.chatboxMessage(`Note: (id-${morphedNpc.gameId}) is a morphed NPC. The parent NPC is (id-${npc.id}).`);
        }
        return null;
    }

    console.log(`WE ARE INTERACTING WITH NPC quests: ${questActions.length} ${matchingHooks.length}`);
    return {
        hooks: matchingHooks,
        actionPosition: position,
        action: {
            player, npc, position, option
        }
    }
};


/**
 * Npc action pipe definition.
 */
export default [ 'npc_interaction', npcInteractionActionPipe ] as ActionPipe;
