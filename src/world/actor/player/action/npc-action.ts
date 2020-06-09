import { Player } from '@server/world/actor/player/player';
import { Npc } from '@server/world/actor/npc/npc';
import { Position } from '@server/world/position';
import { walkToAction } from '@server/world/actor/player/action/action';
import { pluginFilter } from '@server/plugins/plugin-loader';
import { logger } from '@runejs/logger';
import { ActionPlugin, questFilter } from '@server/plugins/plugin';

/**
 * The definition for an NPC action function.
 */
export type npcAction = (details: NpcActionDetails) => void;

/**
 * Details about an NPC being interacted with.
 */
export interface NpcActionDetails {
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
export interface NpcActionPlugin extends ActionPlugin {
    // A single NPC ID or a list of NPC IDs that this action applies to.
    npcIds?: number | number[];
    // A single option name or a list of option names that this action applies to.
    options: string | string[];
    // Whether or not the player needs to walk to this NPC before performing the action.
    walkTo: boolean;
    // The action function to be performed.
    action: npcAction;
}

/**
 * A directory of all NPC interaction plugins.
 */
let npcInteractions: NpcActionPlugin[] = [
];

/**
 * Sets the list of NPC interaction plugins.
 * @param plugins The plugin list.
 */
export const setNpcPlugins = (plugins: ActionPlugin[]): void => {
    npcInteractions = plugins as NpcActionPlugin[];
};

// @TODO priority and cancelling other (lower priority) actions
export const npcAction = (player: Player, npc: Npc, position: Position, option: string): void => {
    if(player.busy) {
        return;
    }

    // Find all NPC action plugins that reference this NPC
    let interactionActions = npcInteractions.filter(plugin => questFilter(player, plugin) && pluginFilter(plugin.npcIds, npc.id, plugin.options, option));
    const questActions = interactionActions.filter(plugin => plugin.questAction !== undefined);

    if(questActions.length !== 0) {
        interactionActions = questActions;
    }

    if(interactionActions.length === 0) {
        player.sendMessage(`Unhandled NPC interaction: ${option} ${npc.name} (id-${npc.id}) @ ${position.x},${position.y},${position.level}`);
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
