import { Player } from '@server/world/mob/player/player';
import { LandscapeObject, LandscapeObjectDefinition } from '@runejs/cache-parser';
import { Position } from '@server/world/position';
import { walkToAction } from '@server/world/mob/player/action/action';
import { pluginFilter } from '@server/plugins/plugin-loader';
import { logger } from '@runejs/logger/dist/logger';

/**
 * The definition for an object action function.
 */
export type objectAction = (details: ObjectActionDetails) => void;

/**
 * Details about an object being interacted with.
 */
export interface ObjectActionDetails {
    player: Player;
    object: LandscapeObject;
    objectDefinition: LandscapeObjectDefinition;
    position: Position;
    cacheOriginal: boolean;
    option: string;
}

/**
 * Defines an object interaction plugin.
 * A list of object ids that apply to the plugin, the options for the object, the action to be performed,
 * and whether or not the player must first walk to the object.
 */
export interface ObjectActionPlugin {
    objectIds: number | number[];
    options: string | string[];
    walkTo: boolean;
    action: objectAction;
}

/**
 * A directory of all object interaction plugins.
 */
let objectInteractions: ObjectActionPlugin[] = [];

/**
 * Sets the list of object interaction plugins.
 * @param plugins The plugin list.
 */
export const setObjectPlugins = (plugins: ObjectActionPlugin[]): void => {
    objectInteractions = plugins;
};

// @TODO priority and cancelling other (lower priority) actions
export const objectAction = (player: Player, landscapeObject: LandscapeObject, landscapeObjectDefinition: LandscapeObjectDefinition,
                             position: Position, option: string, cacheOriginal: boolean): void => {
    // Find all object action plugins that reference this landscape object
    const interactionPlugins = objectInteractions.filter(plugin => pluginFilter(plugin.objectIds, landscapeObject.objectId, plugin.options, option));

    if(interactionPlugins.length === 0) {
        player.packetSender.chatboxMessage(`Unhandled object interaction: ${option} ${landscapeObjectDefinition.name} ` +
            `(id-${landscapeObject.objectId}) @ ${position.x},${position.y},${position.level}`);
        return;
    }

    player.actionsCancelled.next();

    // Separate out walk-to actions from immediate actions
    const walkToPlugins = interactionPlugins.filter(plugin => plugin.walkTo);
    const immediatePlugins = interactionPlugins.filter(plugin => !plugin.walkTo);

    // Make sure we walk to the object before running any of the walk-to plugins
    if(walkToPlugins.length !== 0) {
        walkToAction(player, position, { interactingObject: landscapeObject })
            .then(() => walkToPlugins.forEach(plugin =>
                plugin.action({
                    player,
                    object: landscapeObject,
                    objectDefinition: landscapeObjectDefinition,
                    option,
                    position,
                    cacheOriginal
                })))
            .catch(() => logger.warn(`Unable to complete walk-to action.`));
    }

    // Immediately run any non-walk-to plugins
    if(immediatePlugins.length !== 0) {
        immediatePlugins.forEach(plugin =>
            plugin.action({
                player,
                object: landscapeObject,
                objectDefinition: landscapeObjectDefinition,
                option,
                position,
                cacheOriginal
            }));
    }
};
