import { LandscapeObject } from '@runejs/filestore';
import { activeWorld, Position } from '@engine/world';
import { Actor } from '@engine/world/actor';
import { ActorWalkToTask } from './actor-walk-to-task';

/**
 * A task for an actor to interact with a {@link LandscapeObject}.
 *
 * This task extends {@link ActorWalkToTask} and will walk the actor to the object.
 * Once the actor is within range of the object, the task will expose the {@link landscapeObject} property
 *
 * @author jameskmonger
 */
export abstract class ActorLandscapeObjectInteractionTask<TActor extends Actor = Actor> extends ActorWalkToTask<TActor, LandscapeObject> {
    private _landscapeObject: LandscapeObject;
    private _objectPosition: Position;

    /**
     * Gets the {@link LandscapeObject} that this task is interacting with.
     *
     * @returns If the object is still present, and the actor is at the destination, the object.
     *              Otherwise, `null`.
     *
     * TODO (jameskmonger) unit test this
     */
    protected get landscapeObject(): LandscapeObject | null {
        // TODO (jameskmonger) consider if we want to do these checks rather than delegating to the child task
        //                      as currently the subclass has to store it in a subclass property if it wants to use it
        //                      without these checks
        if (!this.atDestination) {
            return null;
        }

        if (!this._landscapeObject) {
            return null;
        }

        return this._landscapeObject;
    }

    /**
     * Get the position of this task's landscape object
     *
     * @returns The position of this task's landscape object, or null if the landscape object is not present
     */
    protected get landscapeObjectPosition(): Position | null {
        if (!this._landscapeObject) {
            return null;
        }

        return this._objectPosition;
    }

    /**
     * @param actor The actor executing this task.
     * @param landscapeObject The landscape object to interact with.
     * @param sizeX The size of the LandscapeObject in the X direction.
     * @param sizeY The size of the LandscapeObject in the Y direction.
     */
    constructor (
        actor: TActor,
        landscapeObject: LandscapeObject,
        // TODO (jkm) get size/orientation automatically from the object's info
        sizeX: number = 1,
        sizeY: number = 1
    ) {
        super(
            actor,
            landscapeObject,
            // TODO (jkm) atDestination must take orientation into account
            Math.max(sizeX, sizeY)
        );

        if (!landscapeObject) {
            this.stop();
            return;
        }

        // create the Position here to prevent instantiating a new Position every tick
        this._objectPosition = new Position(landscapeObject.x, landscapeObject.y, landscapeObject.level);
        this._landscapeObject = landscapeObject;
    }

    /**
     * Checks for the continued presence of the {@link LandscapeObject} and stops the task if it is no longer present.
     *
     * TODO (jameskmonger) unit test this
     */
    public execute() {
        super.execute();

        if (!this.isActive || !this.atDestination) {
            return;
        }

        if (!this._landscapeObject) {
            this.stop();
            return;
        }

        const { object: worldObject } = activeWorld.findObjectAtLocation(this.actor, this._landscapeObject.objectId, this._objectPosition);

        if (!worldObject) {
            this.stop();
            return;
        }
    }
}
