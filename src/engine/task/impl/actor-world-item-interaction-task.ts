import { WorldItem } from '@engine/world';
import { Actor } from '../../world/actor/actor';
import { ActorWalkToTask } from './actor-walk-to-task';

/**
 * A task for an actor to interact with a world item.
 *
 * This task extends {@link ActorWalkToTask} and will walk the actor to the world item.
 * Once the actor is within range of the world item, the task will expose the {@link worldItem} property
 *
 * @author jameskmonger
 */
export abstract class ActorWorldItemInteractionTask<TActor extends Actor = Actor> extends ActorWalkToTask<TActor> {
    private _worldItem: WorldItem;

    /**
     * @param actor The actor executing this task.
     * @param worldItem The world item to interact with.
     */
    constructor (
        actor: TActor,
        worldItem: WorldItem,
    ) {
        super(
            actor,
            worldItem.position,
            1
        );

        if (!worldItem) {
            this.stop();
            return;
        }

        this._worldItem = worldItem;

    }

    /**
     * Checks for the continued presence of the world item and stops the task if it is no longer present.
     *
     * TODO (jameskmonger) unit test this
     */
    public execute() {
        super.execute();

        if (!this.isActive || !this.atDestination) {
            return;
        }

        if (!this._worldItem || this._worldItem.removed) {
            this.stop();
            return;
        }
    }

    /**
     * Gets the world item that this task is interacting with.
     *
     * @returns If the world item is still present, and the actor is at the destination, the world item.
     *              Otherwise, `null`.
     *
     * TODO (jameskmonger) unit test this
     */
    protected get worldItem(): WorldItem | null {
        // TODO (jameskmonger) consider if we want to do these checks rather than delegating to the child task
        //                      as currently the subclass has to store it in a subclass property if it wants to use it
        //                      without these checks
        if (!this.atDestination) {
            return null;
        }

        if (!this._worldItem || this._worldItem.removed) {
            return null;
        }

        return this._worldItem;
    }
}
