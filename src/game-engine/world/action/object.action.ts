import { Player } from '@engine/world/actor/player/player';
import { LocationObject, LocationObjectDefinition } from '@runejs/cache-parser';
import { Position } from '@engine/world/position';
import { ActionHook, getActionHooks } from '@engine/world/action/hooks';
import { logger } from '@runejs/core';
import { playerWalkTo } from '@engine/game-server';
import { advancedNumberHookFilter, questHookFilter } from '@engine/world/action/hooks/hook-filters';


/**
 * Defines an object action hook.
 */
export interface ObjectActionHook extends ActionHook<objectActionHandler> {
    // A single game object ID or a list of object IDs that this action applies to.
    objectIds: number | number[];
    // A single option name or a list of option names that this action applies to.
    options: string | string[];
    // Whether or not the player needs to walk to this object before performing the action.
    walkTo: boolean;
}


/**
 * The object action hook handler function to be called when the hook's conditions are met.
 */
export type objectActionHandler = (objectAction: ObjectAction) => void;


/**
 * Details about an npc action being performed.
 */
export interface ObjectAction {
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
 * The pipe that the game engine hands object actions off to.
 * @param player
 * @param locationObject
 * @param locationObjectDefinition
 * @param position
 * @param option
 * @param cacheOriginal
 */
const objectActionPipe = (player: Player, locationObject: LocationObject, locationObjectDefinition: LocationObjectDefinition,
    position: Position, option: string, cacheOriginal: boolean): void => {
    if(player.busy || player.metadata.blockObjectInteractions) {
        return;
    }

    // Find all object action plugins that reference this location object
    let interactionActions = getActionHooks<ObjectActionHook>('object_action')
        .filter(plugin => questHookFilter(player, plugin) && advancedNumberHookFilter(plugin.objectIds, locationObject.objectId, plugin.options, option));
    const questActions = interactionActions.filter(plugin => plugin.questRequirement !== undefined);

    if(questActions.length !== 0) {
        interactionActions = questActions;
    }

    if(interactionActions.length === 0) {
        player.outgoingPackets.chatboxMessage(`Unhandled object interaction: ${option} ${locationObjectDefinition.name} ` +
            `(id-${locationObject.objectId}) @ ${position.x},${position.y},${position.level}`);
        return;
    }

    player.actionsCancelled.next(null);

    // Separate out walk-to actions from immediate actions
    const walkToPlugins = interactionActions.filter(plugin => plugin.walkTo);
    const immediatePlugins = interactionActions.filter(plugin => !plugin.walkTo);

    // Make sure we walk to the object before running any of the walk-to plugins
    if(walkToPlugins.length !== 0) {
        playerWalkTo(player, position, { interactingObject: locationObject })
            .then(() => {
                player.face(position);

                walkToPlugins.forEach(plugin =>
                    plugin.handler({
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
            plugin.handler({
                player,
                object: locationObject,
                objectDefinition: locationObjectDefinition,
                option,
                position,
                cacheOriginal
            }));
    }
};


/**
 * Object action pipe definition.
 */
export default [
    'object_action', objectActionPipe
];
