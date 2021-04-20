import { Player } from '@engine/world/actor/player/player';
import { Position } from '@engine/world/position';
import { ActionHook, getActionHooks } from '@engine/world/action/hooks';
import { playerWalkTo } from '@engine/game-server';
import { advancedNumberHookFilter, questHookFilter } from '@engine/world/action/hooks/hook-filters';
import { ActionPipe, RunnableHooks } from '@engine/world/action/index';
import { LandscapeObject, ObjectConfig } from '@runejs/filestore';


/**
 * Defines an object action hook.
 */
export interface ObjectInteractionActionHook extends ActionHook<ObjectInteractionAction, objectInteractionActionHandler> {
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
                                     position: Position, option: string, cacheOriginal: boolean): RunnableHooks<ObjectInteractionAction> => {
    if(player.metadata.blockObjectInteractions) {
        return null;
    }

    // Find all object action plugins that reference this location object
    let matchingHooks = getActionHooks<ObjectInteractionActionHook>('object_interaction')
        .filter(plugin => questHookFilter(player, plugin) &&
            advancedNumberHookFilter(plugin.objectIds, landscapeObject.objectId, plugin.options, option));
    const questActions = matchingHooks.filter(plugin => plugin.questRequirement !== undefined);

    if(questActions.length !== 0) {
        matchingHooks = questActions;
    }

    if(matchingHooks.length === 0) {
        player.outgoingPackets.chatboxMessage(`Unhandled object interaction: ${option} ${objectConfig.name} ` +
            `(id-${landscapeObject.objectId}) @ ${position.x},${position.y},${position.level}`);
        return null;
    }

    return {
        hooks: matchingHooks,
        actionPosition: position,
        action: {
            player,
            object: landscapeObject,
            objectConfig,
            option,
            position,
            cacheOriginal
        }
    }
};


/**
 * Object action pipe definition.
 */
export default [ 'object_interaction', objectInteractionActionPipe ] as ActionPipe;
