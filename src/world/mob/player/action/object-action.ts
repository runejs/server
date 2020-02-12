import { Player } from '@server/world/mob/player/player';
import { LandscapeObject } from '@runejs/cache-parser';
import { Position } from '@server/world/position';
import { walkToAction } from '@server/world/mob/player/action/action';

/**
 * The definition for an object action function.
 */
export type objectAction = (player: Player, landscapeObject: LandscapeObject, position: Position, cacheOriginal: boolean) => void;

/**
 * Defines an object interaction plugin.
 * A list of object ids that apply to the plugin, the action to be performed, and whether or not the player must first walk to the object.
 */
export interface ObjectActionPlugin {
    objectIds: number[];
    action: objectAction;
    walkTo: boolean;
}

/**
 * A directory of all object interaction plugins.
 */
let objectInteractions: ObjectActionPlugin[] = [];

/**
 * Sets the list of object interaction plugins. Only to be called on server startup!
 * @param plugins The plugin list.
 */
export const setObjectPlugins = (plugins: ObjectActionPlugin[]): void => {
    objectInteractions = plugins;
};

// @TODO priority and cancelling other (lower priority) actions
export const objectAction = (player: Player, landscapeObject: LandscapeObject, position: Position, cacheOriginal: boolean): void => {
    // Find all object action plugins that reference this landscape object
    const interactionPlugins = objectInteractions.filter(plugin => plugin.objectIds.indexOf(landscapeObject.objectId) !== -1);

    if(interactionPlugins.length === 0) {
        player.packetSender.chatboxMessage(`Unhandled object interaction: ${landscapeObject.objectId} @ ${position.x},${position.y},${position.level}`);
        return;
    }

    // Separate out walk-to actions from immediate actions
    const walkToPlugins = interactionPlugins.filter(plugin => plugin.walkTo);
    const immediatePlugins = interactionPlugins.filter(plugin => !plugin.walkTo);

    // Make sure we walk to the object before running any of the walk-to plugins
    if(walkToPlugins.length !== 0) {
        walkToAction(player, position).then(() => walkToPlugins.forEach(plugin => plugin.action(player, landscapeObject, position, cacheOriginal)));
    }

    // Immediately run any non-walk-to plugins
    if(immediatePlugins.length !== 0) {
        immediatePlugins.forEach(plugin => plugin.action(player, landscapeObject, position, cacheOriginal));
    }
};
