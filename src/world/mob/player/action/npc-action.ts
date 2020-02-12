import { Player } from '@server/world/mob/player/player';
import { Npc } from '@server/world/mob/npc/npc';
import { Position } from '@server/world/position';
import { walkToAction } from '@server/world/mob/player/action/action';

/**
 * The definition for an NPC action function.
 */
export type npcAction = (player: Player, npc: Npc, position?: Position) => void;

/**
 * Defines an NPC interaction plugin.
 * A list of NPC ids that apply to the plugin, the action to be performed, and whether or not the player must first walk to the NPC.
 */
export interface NpcActionPlugin {
    npcIds: number[];
    action: npcAction;
    walkTo: boolean;
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
export const setNpcPlugins = (plugins: NpcActionPlugin[]): void => {
    npcInteractions = plugins;
};

// @TODO priority and cancelling other (lower priority) actions
export const npcAction = (player: Player, npc: Npc, position: Position): void => {
    // Find all object action plugins that reference this landscape object
    console.log(JSON.stringify(npcInteractions));
    const interactionPlugins = npcInteractions.filter(plugin => plugin.npcIds.indexOf(npc.id) !== -1);

    if(interactionPlugins.length === 0) {
        player.packetSender.chatboxMessage(`Unhandled NPC interaction: ${npc.id} @ ${position.x},${position.y},${position.level}`);
        return;
    }

    // Separate out walk-to actions from immediate actions
    const walkToPlugins = interactionPlugins.filter(plugin => plugin.walkTo);
    const immediatePlugins = interactionPlugins.filter(plugin => !plugin.walkTo);

    // Make sure we walk to the NPC before running any of the walk-to plugins
    if(walkToPlugins.length !== 0) {
        walkToAction(player, position).then(() => walkToPlugins.forEach(plugin => plugin.action(player, npc, position)));
    }

    // Immediately run any non-walk-to plugins
    if(immediatePlugins.length !== 0) {
        immediatePlugins.forEach(plugin => plugin.action(player, npc, position));
    }
};
