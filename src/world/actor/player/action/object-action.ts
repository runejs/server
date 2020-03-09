import { Player } from '@server/world/actor/player/player';
import { LandscapeObject, LandscapeObjectDefinition } from '@runejs/cache-parser';
import { Position } from '@server/world/position';
import { walkToAction } from '@server/world/actor/player/action/action';
import { pluginFilter } from '@server/plugins/plugin-loader';
import { logger } from '@runejs/logger/dist/logger';
import { ActionPlugin, questFilter } from '@server/plugins/plugin';

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
export interface ObjectActionPlugin extends ActionPlugin {
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
export const setObjectPlugins = (plugins: ActionPlugin[]): void => {
    objectInteractions = plugins as ObjectActionPlugin[];
};

// @TODO priority and cancelling other (lower priority) actions
export const objectAction = (player: Player, landscapeObject: LandscapeObject, landscapeObjectDefinition: LandscapeObjectDefinition,
                             position: Position, option: string, cacheOriginal: boolean): void => {
    if(player.busy) {
        return;
    }

    // Find all object action plugins that reference this landscape object
    let interactionActions = objectInteractions.filter(plugin => questFilter(player, plugin) && pluginFilter(plugin.objectIds, landscapeObject.objectId, plugin.options, option));
    const questActions = interactionActions.filter(plugin => plugin.questAction !== undefined);

    if(questActions.length !== 0) {
        interactionActions = questActions;
    }

    if(interactionActions.length === 0) {
        player.outgoingPackets.chatboxMessage(`Unhandled object interaction: ${option} ${landscapeObjectDefinition.name} ` +
            `(id-${landscapeObject.objectId}) @ ${position.x},${position.y},${position.level}`);
        return;
    }

    player.actionsCancelled.next();

    // Separate out walk-to actions from immediate actions
    const walkToPlugins = interactionActions.filter(plugin => plugin.walkTo);
    const immediatePlugins = interactionActions.filter(plugin => !plugin.walkTo);

    // Make sure we walk to the object before running any of the walk-to plugins
    if(walkToPlugins.length !== 0) {
        walkToAction(player, position, { interactingObject: landscapeObject })
            .then(() => {
                player.face(position);

                walkToPlugins.forEach(plugin =>
                    plugin.action({
                        player,
                        object: landscapeObject,
                        objectDefinition: landscapeObjectDefinition,
                        option,
                        position,
                        cacheOriginal
                    }))
            })
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
