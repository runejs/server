import { LandscapeObject, ObjectConfig } from '@runejs/filestore';
import { Position } from '@engine/world';
import { Player } from '@engine/world/actor';
import {
    ActionHook, getActionHooks, advancedNumberHookFilter, questHookFilter, ActionPipe, RunnableHooks
} from '@engine/action';
import { ActorLandscapeObjectInteractionTask } from '@engine/task/impl';


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
 * Details about an object action being performed.
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
 * This is a task to migrate old `walkTo` object interaction actions to the new task system.
 *
 * This is a first-pass implementation to allow for removal of the old action system.
 * It will be refactored in future to be more well suited to our plugin system.
 */
class WalkToObjectInteractionTask extends ActorLandscapeObjectInteractionTask<Player> {
    /**
     * The plugins to execute when the player arrives at the object.
     */
    private plugins: ObjectInteractionActionHook[];

    /**
     * Additional details about the object that the action is being performed on.
     */
    private objectConfig: ObjectConfig; // TODO (jkm) move to base class

    /**
     * Whether or not this game object is an original map object or if it has been added/replaced.
     */
    private cacheOriginal: boolean;

    /**
     * The option that the player used (ie "cut" tree, or "smelt" furnace).
     */
    private option: string;

    constructor(plugins: ObjectInteractionActionHook[], player: Player, landscapeObject: LandscapeObject, objectConfig: ObjectConfig, cacheOriginal: boolean, option: string) {
        super(
            player,
            landscapeObject,
            // TODO (jkm) handle object size
            // TODO (jkm) pass orientation instead of size
            1,
            1,
        );

        this.plugins = plugins;
        this.objectConfig = objectConfig;
        this.cacheOriginal = cacheOriginal;
        this.option = option;
    }

    /**
     * Executed every tick to check if the player has arrived yet and calls the plugins if so.
     */
    public execute(): void {
        // call super to manage waiting for the movement to complete
        super.execute();

        // check if the player has arrived yet
        const landscapeObject = this.landscapeObject;
        const landscapeObjectPosition = this.landscapeObjectPosition;
        if (!landscapeObject || !landscapeObjectPosition) {
            return;
        }

        // call the relevant plugins
        this.plugins.forEach(plugin => {
            if (!plugin || !plugin.handler) {
                return;
            }

            plugin.handler({
                player: this.actor,
                object: landscapeObject,
                objectConfig: this.objectConfig,
                position: landscapeObjectPosition,
                option: this.option,
                cacheOriginal: this.cacheOriginal // TODO remove this - plugins shouldn't be concerned with whether objects are real or not
            });
        });

        // this task only executes once, on arrival
        this.stop();
    }
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
                                     position: Position, option: string, cacheOriginal: boolean): RunnableHooks<ObjectInteractionAction> | null => {
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

    const walkToPlugins = matchingHooks.filter(plugin => plugin.walkTo);

    if (walkToPlugins.length > 0) {
        player.enqueueBaseTask(new WalkToObjectInteractionTask(walkToPlugins, player, landscapeObject, objectConfig, cacheOriginal, option));

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
