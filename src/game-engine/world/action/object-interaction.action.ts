import { Player } from '@engine/world/actor/player/player';
import { Position } from '@engine/world/position';
import { ActionHook, getActionHooks } from '@engine/world/action/hooks';
import { logger } from '@runejs/core';
import { playerWalkTo } from '@engine/game-server';
import { advancedNumberHookFilter, questHookFilter } from '@engine/world/action/hooks/hook-filters';
import { ActionPipe } from '@engine/world/action/index';
import { LandscapeObject, ObjectConfig } from '@runejs/filestore';


/**
 * Defines an object action hook.
 */
export interface ObjectInteractionActionHook extends ActionHook<objectInteractionActionHandler> {
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
export type objectInteractionActionHandler = (objectInteractionAction: ObjectInteractionAction) => void;


/**
 * Details about an npc action being performed.
 */
export interface ObjectInteractionAction {
    // The player performing the action.
    player: Player;
    // The object the action is being performed on.
    object: LandscapeObject;
    // Additional details about the object that the action is being performed on.
    objectConfig: ObjectConfig;
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
 * @param landscapeObject
 * @param objectConfig
 * @param position
 * @param option
 * @param cacheOriginal
 */
const objectInteractionActionPipe = (player: Player, landscapeObject: LandscapeObject, objectConfig: ObjectConfig,
                                     position: Position, option: string, cacheOriginal: boolean): void => {
    if(player.busy || player.metadata.blockObjectInteractions) {
        return;
    }

    // Find all object action plugins that reference this location object
    let interactionActions = getActionHooks<ObjectInteractionActionHook>('object_interaction')
        .filter(plugin => questHookFilter(player, plugin) && advancedNumberHookFilter(plugin.objectIds,
            landscapeObject.objectId, plugin.options, option));
    const questActions = interactionActions.filter(plugin => plugin.questRequirement !== undefined);

    if(questActions.length !== 0) {
        interactionActions = questActions;
    }

    if(interactionActions.length === 0) {
        player.outgoingPackets.chatboxMessage(`Unhandled object interaction: ${option} ${objectConfig.name} ` +
            `(id-${landscapeObject.objectId}) @ ${position.x},${position.y},${position.level}`);
        return;
    }

    player.actionsCancelled.next(null);

    // Separate out walk-to actions from immediate actions
    const walkToPlugins = interactionActions.filter(plugin => plugin.walkTo);
    const immediatePlugins = interactionActions.filter(plugin => !plugin.walkTo);

    // Make sure we walk to the object before running any of the walk-to plugins
    if(walkToPlugins.length !== 0) {
        playerWalkTo(player, position, { interactingObject: landscapeObject })
            .then(() => {
                player.face(position);

                walkToPlugins.forEach(plugin =>
                    plugin.handler({
                        player,
                        object: landscapeObject,
                        objectConfig,
                        option,
                        position,
                        cacheOriginal
                    }));
            })
            .catch(error => {
                logger.warn(`Unable to complete walk-to action.`);
                console.error(error);
            });
    }

    // Immediately run any non-walk-to plugins
    if(immediatePlugins.length !== 0) {
        immediatePlugins.forEach(plugin =>
            plugin.handler({
                player,
                object: landscapeObject,
                objectConfig,
                option,
                position,
                cacheOriginal
            }));
    }
};


/**
 * Object action pipe definition.
 */
export default [ 'object_interaction', objectInteractionActionPipe ] as ActionPipe;
