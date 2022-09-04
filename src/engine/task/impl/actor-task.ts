import { Subscription } from 'rxjs';
import { Actor } from '@engine/world/actor';
import { TaskBreakType, TaskConfig } from '../types';
import { Task } from '../task';

/**
 * A task that is executed by an actor.
 *
 * If the task has a break type of ON_MOVE, the ActorTask will subscribe to the actor's
 * movement events and will stop executing when the actor moves.
 *
 * @author jameskmonger
 */
export abstract class ActorTask<TActor extends Actor = Actor> extends Task {
    /**
     * A function that is called when a movement event is queued on the actor.
     *
     * This will be `null` if the task does not break on movement.
     */
    private walkingQueueSubscription: Subscription | null = null;

    /**
     * @param actor The actor executing this task.
     * @param config The task configuration.
     */
    constructor(
        protected readonly actor: TActor,
        config?: TaskConfig
    ) {
        super(config);

        this.listenForMovement();
    }

    /**
     * Called when the task is stopped and unsubscribes from the actor's walking queue if necessary.
     *
     * TODO (jameskmonger) unit test this
     */
    public onStop(): void {
        if (this.walkingQueueSubscription) {
            this.walkingQueueSubscription.unsubscribe();
        }
    }

    /**
     * If required, listen to the actor's walking queue to stop the task
     *
     * This function uses `setImmediate` to ensure that the subscription to the
     * walking queue is not created
     *
     * TODO (jameskmonger) unit test this
     */
    private listenForMovement(): void {
        if (!this.breaksOn(TaskBreakType.ON_MOVE)) {
            return;
        }

        setImmediate(() => {
            this.walkingQueueSubscription = this.actor.walkingQueue.movementQueued$.subscribe(() => {
                this.stop();
            });
        });
    }
}
