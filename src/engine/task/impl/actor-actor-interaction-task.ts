import { LandscapeObject } from '@runejs/filestore';
import { activeWorld, Position } from '@engine/world';
import { Actor } from '@engine/world/actor';
import { ActorWalkToTask } from './actor-walk-to-task';

/**
 * A task for an {@link Actor} to interact with another {@link Actor}.
 *
 * This task extends {@link ActorWalkToTask} and will walk the actor to the object.
 * Once the actor is within range of the target Actor, the task will expose the `otherActor` property
 *
 * @author jameshallam
 */
export abstract class ActorActorInteractionTask<TActor extends Actor = Actor, TOtherActor extends Actor = Actor> extends ActorWalkToTask<TActor, Position> {
    /*
     * TODO (jameskmonger) consider exposing this, currently people must always access it through `otherActor`
     *           or through their own constructor
     */
    private _targetActor: TOtherActor;

    /**
     * Gets the {@link TOtherActor} that this task is interacting with.
     *
     * @returns The target actor, if is still present, and if the actor is at the destination.
     *              Otherwise, `null`.
     *
     * TODO (jameskmonger) unit test this
     */
    protected get otherActor(): TOtherActor | null {
        if (!this.atDestination) {
            return null;
        }

        if (!this._targetActor) {
            return null;
        }

        return this._targetActor;
    }

    /**
     * Get the position of this task's target npc
     *
     * @returns The position of this task's target npc, or `null` if the npc is not present
     */
    protected get otherActorPosition(): Position {
        if (!this._targetActor) {
            return null;
        }
        return this._targetActor.position
    }

    /**
     * @param actor The actor executing this task.
     * @param targetActor The `TOtherActor` to interact with.
     * @param sizeX The size of the target TOtherActor in the X direction.
     * @param sizeY The size of the target TOtherActor in the Y direction.
     */
    constructor (
        actor: TActor,
        targetActor: TOtherActor,
        sizeX: number = 1,
        sizeY: number = 1
    ) {
        super(
            actor,
            // TODO (jameskmonger) this doesn't currently account for a moving NPC target
            targetActor.position,
            Math.max(sizeX, sizeY)
        );

        if (!targetActor) {
            this.stop();
            return;
        }

        this._targetActor = targetActor;
    }

    /**
     * Checks for the continued presence of the target {@link Actor}, and stops the task if it is no longer present.
     *
     * TODO (jameskmonger) unit test this
     */
    public execute() {
        super.execute();

        if (!this.isActive || !this.atDestination) {
            return;
        }

        // stop the task if the actor no longer exists
        if (!this._targetActor) {
            this.stop();
            return;
        }

        // TODO: check npc still exists
    }
}
