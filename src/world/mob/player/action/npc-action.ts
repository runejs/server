import { Player } from '@server/world/mob/player/player';
import { Npc } from '@server/world/mob/npc/npc';
import { Position } from '@server/world/position';
import { walkToAction } from '@server/world/mob/player/action/action';
import { pluginFilter } from '@server/plugins/plugin-loader';
import { logger } from '@runejs/logger/dist/logger';

/**
 * The definition for an NPC action function.
 */
export type npcAction = (details: NpcActionDetails) => void;

/**
 * Details about an NPC being interacted with.
 */
export interface NpcActionDetails {
    player: Player;
    npc: Npc;
    position: Position;
}

/**
 * Defines an NPC interaction plugin.
 * A list of NPC ids that apply to the plugin, the option selected, the action to be performed,
 * and whether or not the player must first walk to the NPC.
 */
export interface NpcActionPlugin {
    npcIds: number | number[];
    options: string | string[];
    walkTo: boolean;
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
export const setNpcPlugins = (plugins: NpcActionPlugin[]): void => {
    npcInteractions = plugins;
};

// @TODO priority and cancelling other (lower priority) actions
export const npcAction = (player: Player, npc: Npc, position: Position, option: string): void => {
    // Find all NPC action plugins that reference this NPC
    const interactionPlugins = npcInteractions.filter(plugin => pluginFilter(plugin.npcIds, npc.id, plugin.options, option));

    if(interactionPlugins.length === 0) {
        player.packetSender.chatboxMessage(`Unhandled NPC interaction: ${option} ${npc.name} (id-${npc.id}) @ ${position.x},${position.y},${position.level}`);
        return;
    }

    player.actionsCancelled.next();

    // Separate out walk-to actions from immediate actions
    const walkToPlugins = interactionPlugins.filter(plugin => plugin.walkTo);
    const immediatePlugins = interactionPlugins.filter(plugin => !plugin.walkTo);

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
