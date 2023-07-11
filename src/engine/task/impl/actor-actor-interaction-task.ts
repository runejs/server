import { LandscapeObject } from '@runejs/filestore';
import { Position } from '@engine/world';
import { Actor } from '@engine/world/actor';
import { ActorWalkToTask } from './actor-walk-to-task';

/**
 * A task for an actor to interact with another actor.
 *
 * This task extends {@link ActorWalkToTask} and will walk the actor to the other actor.
 * Once the actor is within range of the other actor, the task will expose the {@link other} property
 *
 * @author jameskmonger
 */
export abstract class ActorActorInteractionTask<TActor extends Actor = Actor, TOtherActor extends Actor = Actor> extends ActorWalkToTask<TActor, () => Position> {
    private _other: TOtherActor;

    /**
     * Gets the {@link TOtherActor} that this task is interacting with.
     *
     * @returns If the other actor is still present, and the actor is at the destination, the other actor.
     *              Otherwise, `null`.
     *
     * TODO (jameskmonger) unit test this
     */
    protected get other(): TOtherActor | null {
        // TODO (jameskmonger) consider if we want to do these checks rather than delegating to the child task
        //                      as currently the subclass has to store it in a subclass property if it wants to use it
        //                      without these checks
        if (!this.atDestination) {
            return null;
        }

        if (!this._other) {
            return null;
        }

        return this._other;
    }

    /**
     * @param actor The actor executing this task.
     * @param TOtherActor The other actor to interact with.
     * @param walkOnStart Whether to walk to the other actor on task start.
     *                    Defaults to `false` as the client generally inits a walk on interaction.
     */
    constructor (
        actor: TActor,
        otherActor: TOtherActor,
        walkOnStart = false
    ) {

        super(
            actor,
            () => otherActor.position,
            // TODO (jkm) handle other actor size
            1,
            walkOnStart
        );

        if (!otherActor) {
            this.stop();
            return;
        }

        this._other = otherActor;
    }

    /**
     * Checks for the continued presence of the other actor and stops the task if it is no longer present.
     *
     * TODO (jameskmonger) unit test this
     */
    public execute() {
        super.execute();

        if (!this.isActive || !this.atDestination) {
            return;
        }

        if (!this._other) {
            this.stop();
            return;
        }

        // TODO (jkm) check if other actor was removed from world
        // TODO (jkm) check if other actor has moved and repath player if so
    }
}
