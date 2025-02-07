import type { ActionHook } from '@engine/action/hook/action-hook';
import type { ItemOnObjectAction } from '@engine/action/pipe/item-on-object.action';
import type { ObjectInteractionAction } from '@engine/action/pipe/object-interaction.action';
import { ActorLandscapeObjectInteractionTask } from '@engine/task/impl/actor-landscape-object-interaction-task';
import type { Player } from '@engine/world/actor/player/player';
import { Position } from '@engine/world/position';
import type { LandscapeObject } from '@runejs/filestore';

/**
 * All actions supported by this plugin task.
 */
type ObjectAction = ObjectInteractionAction | ItemOnObjectAction;

/**
 * An ActionHook for a supported ObjectAction.
 */
type ObjectActionHook<TAction extends ObjectAction> = ActionHook<TAction, (data: TAction) => void>;

/**
 * The data unique to the action being executed (i.e. excluding shared data)
 */
type ObjectActionData<TAction extends ObjectAction> = Omit<TAction, 'player' | 'object' | 'position'>;

/**
 * This is a task to migrate old `walkTo` item interaction actions to the new task system.
 *
 * This is a first-pass implementation to allow for removal of the old action system.
 * It will be refactored in future to be more well suited to our plugin system.
 */
export class WalkToObjectPluginTask<TAction extends ObjectAction> extends ActorLandscapeObjectInteractionTask<Player> {
    /**
     * The plugins to execute when the player arrives at the object.
     */
    private plugins: ObjectActionHook<TAction>[];

    private data: ObjectActionData<TAction>;

    constructor(plugins: ObjectActionHook<TAction>[], player: Player, landscapeObject: LandscapeObject, data: ObjectActionData<TAction>) {
        const rendering = data.objectConfig?.rendering;
        let sizeX = rendering?.sizeX || 1;
        let sizeY = rendering?.sizeY || 1;

        // Get the object's facing direction (0-3 maps to WNES array) TODO: verify
        const face = rendering?.face || 0;

        // If facing East or West, swap X and Y dimensions
        if (face === 0 || face === 2) {
            // WEST or EAST
            [sizeX, sizeY] = [sizeY, sizeX];
        }
        super(
            player,
            landscapeObject,
            // TODO (jkm) handle object size
            // TODO (jkm) pass orientation instead of size
            sizeX,
            sizeY,
        );
        this.plugins = plugins;
        this.data = data;
    }

    protected onObjectReached(): void {
        const landscapeObject = this.landscapeObject;
        const landscapeObjectPosition = this.landscapeObjectPosition;

        if (!landscapeObject || !landscapeObjectPosition) {
            this.stop();
            return;
        }

        // Make the actor face the center of the object
        const objectCenter = new Position(
            landscapeObjectPosition.x + Math.floor((this.data.objectConfig?.rendering?.sizeX || 1) / 2),
            landscapeObjectPosition.y + Math.floor((this.data.objectConfig?.rendering?.sizeY || 1) / 2),
            landscapeObjectPosition.level,
        );
        this.actor.face(objectCenter);

        this.plugins.forEach(plugin => {
            if (!plugin?.handler) return;

            const action = {
                player: this.actor,
                object: landscapeObject,
                position: landscapeObjectPosition,
                ...this.data,
            } as TAction;

            plugin.handler(action);
        });

        // this task only executes once, on arrival
        this.stop();
    }
}
