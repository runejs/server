import { Player } from '@server/world/actor/player/player';
import { LocationObject, LocationObjectDefinition } from '@runejs/cache-parser';
import { Position } from '@server/world/position';
import { Action, getActionList, walkToAction } from '@server/world/action/index';
import { pluginFilter } from '@server/plugins/plugin-loader';
import { logger } from '@runejs/core';
import { questFilter } from '@server/plugins/plugin';

/**
 * The definition for an object action function.
 */
export type objectAction = (objectActionData: ObjectActionData) => void;

/**
 * Details about an object being interacted with.
 */
export interface ObjectActionData {
    // The player performing the action.
    player: Player;
    // The object the action is being performed on.
    object: LocationObject;
    // Additional details about the object that the action is being performed on.
    objectDefinition: LocationObjectDefinition;
    // The position that the game object was at when the action was initiated.
    position: Position;
    // Whether or not this game object is an original map object or if it has been added/replaced.
    cacheOriginal: boolean;
    // The option that the player used (ie "cut" tree, or "smelt" furnace).
    option: string;
}

/**
 * Defines an object interaction plugin.
 * A list of object ids that apply to the plugin, the options for the object, the action to be performed,
 * and whether or not the player must first walk to the object.
 */
export interface ObjectAction extends Action {
    // A single game object ID or a list of object IDs that this action applies to.
    objectIds: number | number[];
    // A single option name or a list of option names that this action applies to.
    options: string | string[];
    // Whether or not the player needs to walk to this object before performing the action.
    walkTo: boolean;
    // The action function to be performed.
    action: objectAction;
}

// @TODO priority and cancelling other (lower priority) actions
const objectActionHandler = (player: Player, locationObject: LocationObject, locationObjectDefinition: LocationObjectDefinition,
    position: Position, option: string, cacheOriginal: boolean): void => {
    if(player.busy || player.metadata.blockObjectInteractions) {
        return;
    }

    // Find all object action plugins that reference this location object
    let interactionActions = getActionList('object_action').filter(plugin => questFilter(player, plugin) && pluginFilter(plugin.objectIds, locationObject.objectId, plugin.options, option));
    const questActions = interactionActions.filter(plugin => plugin.questRequirement !== undefined);

    if(questActions.length !== 0) {
        interactionActions = questActions;
    }

    if(interactionActions.length === 0) {
        player.outgoingPackets.chatboxMessage(`Unhandled object interaction: ${option} ${locationObjectDefinition.name} ` +
            `(id-${locationObject.objectId}) @ ${position.x},${position.y},${position.level}`);
        return;
    }

    player.actionsCancelled.next();

    // Separate out walk-to actions from immediate actions
    const walkToPlugins = interactionActions.filter(plugin => plugin.walkTo);
    const immediatePlugins = interactionActions.filter(plugin => !plugin.walkTo);

    // Make sure we walk to the object before running any of the walk-to plugins
    if(walkToPlugins.length !== 0) {
        walkToAction(player, position, { interactingObject: locationObject })
            .then(() => {
                player.face(position);

                walkToPlugins.forEach(plugin =>
                    plugin.action({
                        player,
                        object: locationObject,
                        objectDefinition: locationObjectDefinition,
                        option,
                        position,
                        cacheOriginal
                    }));
            })
            .catch(() => logger.warn(`Unable to complete walk-to action.`));
    }

    // Immediately run any non-walk-to plugins
    if(immediatePlugins.length !== 0) {
        immediatePlugins.forEach(plugin =>
            plugin.action({
                player,
                object: locationObject,
                objectDefinition: locationObjectDefinition,
                option,
                position,
                cacheOriginal
            }));
    }
};

export default {
    action: 'object_action',
    handler: objectActionHandler
};
