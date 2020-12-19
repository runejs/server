import { Player } from '@server/world/actor/player/player';
import { Npc } from '@server/world/actor/npc/npc';
import { Position } from '@server/world/position';
import { Action, getActionList, walkToAction } from '@server/world/action/index';
import { basicStringFilter } from '@server/plugins/plugin-loader';
import { logger } from '@runejs/core';
import { questFilter } from '@server/plugins/plugin';

/**
 * The definition for an NPC action function.
 */
export type npcAction = (npcActionData: NpcActionData) => void;

/**
 * Details about an NPC being interacted with.
 */
export interface NpcActionData {
    // The player performing the action.
    player: Player;
    // The NPC the action is being performed on.
    npc: Npc;
    // The position that the NPC was at when the action was initiated.
    position: Position;
}

/**
 * Defines an NPC interaction plugin.
 * A list of NPC ids that apply to the plugin, the option selected, the action to be performed,
 * and whether or not the player must first walk to the NPC.
 */
export interface NpcAction extends Action {
    // A single NPC key or a list of NPC keys that this action applies to.
    npcs?: string | string[];
    // A single option name or a list of option names that this action applies to.
    options?: string | string[];
    // Whether or not the player needs to walk to this NPC before performing the action.
    walkTo: boolean;
    // The action function to be performed.
    action: npcAction;
}

// @TODO priority and cancelling other (lower priority) actions
const npcActionHandler = (player: Player, npc: Npc, position: Position, option: string): void => {
    if(player.busy) {
        return;
    }

    // Find all NPC action plugins that reference this NPC
    let interactionActions = getActionList('npc_action')
        .filter(plugin => questFilter(player, plugin) &&
            (!plugin.npcs || basicStringFilter(plugin.npcs, npc.key)) &&
            (!plugin.options || basicStringFilter(plugin.options, option)));
    const questActions = interactionActions.filter(plugin => plugin.questRequirement !== undefined);

    if(questActions.length !== 0) {
        interactionActions = questActions;
    }

    if(interactionActions.length === 0) {
        logger.warn(`Unhandled NPC interaction: ${option} ${npc.key} (id-${npc.id}) @ ${position.x},${position.y},${position.level}`);
        logger.warn(npc.id, npc.key, npc.name);
        return;
    }

    player.actionsCancelled.next();

    // Separate out walk-to actions from immediate actions
    const walkToPlugins = interactionActions.filter(plugin => plugin.walkTo);
    const immediatePlugins = interactionActions.filter(plugin => !plugin.walkTo);

    // Make sure we walk to the NPC before running any of the walk-to plugins
    if(walkToPlugins.length !== 0) {
        walkToAction(player, position)
            .then(() => {
                player.face(npc);
                npc.face(player);
                walkToPlugins.forEach(plugin => plugin.action({ player, npc, position }));
            })
            .catch(() => logger.warn(`Unable to complete walk-to action.`));
    }

    // Immediately run any non-walk-to plugins
    if(immediatePlugins.length !== 0) {
        immediatePlugins.forEach(plugin => plugin.action({ player, npc, position }));
    }
};

export default {
    action: 'npc_action',
    handler: npcActionHandler
};
