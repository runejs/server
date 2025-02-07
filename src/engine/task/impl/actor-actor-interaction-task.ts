import { Task } from '@engine/task/task';
import { Actor } from '@engine/world/actor/actor';
import { ActorWalkToTask } from './actor-walk-to-task';

/**
 * A task for an actor to interact with another actor.
 *
 * This task extends {@link ActorWalkToTask} and will walk the actor to the other actor.
 * Once the actor is within range of the other actor, the task will expose the {@link other} property
 *
 * @author jameskmonger
 */
export class ActorActorInteractionTask<TActor extends Actor, TOther extends Actor> extends Task {
    protected arrived: boolean = false;

    constructor(
        protected actor: TActor,
        protected other: TOther,
    ) {
        super();
    }

    public async execute(): Promise<void> {
        if (!this.other || !this.other.position) {
            this.stop();
            return;
        }

        if (!this.arrived) {
            try {
                await this.actor.moveTo(this.other);

                // Apply arrive delay only once we reach the target
                this.actor.delayManager.applyArriveDelay();

                this.arrived = true;
            } catch (error) {
                this.stop();
                return;
            }
        }
    }
}
