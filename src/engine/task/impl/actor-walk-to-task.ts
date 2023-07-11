import { LandscapeObject } from '@runejs/filestore';
import { Position } from '@engine/world/position';
import { Actor } from '@engine/world/actor';
import { TaskStackType, TaskBreakType, TaskStackGroup } from '../types';
import { ActorTask } from './actor-task';

/**
 * Possible types of targets for an actor to walk to.
 */
type WalkToTargetType = LandscapeObject | Position;

/**
 * The target can either be a {@link WalkToTargetType} or a function that returns a {@link WalkToTargetType}.
 */
type WalkToTarget = WalkToTargetType | (() => WalkToTargetType);

/**
 * This ActorWalkToTask interface allows us to merge with the ActorWalkToTask class
 * and add optional methods to the class.
 *
 * There is no way to add optional methods directly to an abstract class.
 *
 * @author jameskmonger
 */
export interface ActorWalkToTask<TActor extends Actor = Actor, TTarget extends WalkToTarget = Position> extends ActorTask<TActor> {
    /**
     * An optional function that is called when the actor arrives at the destination.
     */
    onArrive?(): void;
}

/**
 * An abstract task that will make an Actor walk to a specific position,
 * before calling the `arrive` function and continuing execution.
 *
 * The task will be stopped if the adds a new movement to their walking queue.
 *
 * @author jameskmonger
 */
export abstract class ActorWalkToTask<TActor extends Actor = Actor, TTarget extends WalkToTarget = Position> extends ActorTask<TActor> {
    private _atDestination: boolean = false;

    /**
     * `true` if the actor has arrived at the destination.
     */
    protected get atDestination(): boolean {
        return this._atDestination;
    }

    /**
     * @param actor The actor executing this task.
     * @param destination The destination position/object, or a function that returns the destination position/object.
     * @param distance The distance from the destination position that the actor must be within to arrive.
     * @param walkOnStart Whether to walk to the destination on task start.
     */
    constructor (
        actor: TActor,
        protected readonly destination: TTarget,
        protected readonly distance = 1,
        walkOnStart = true
    ) {
        super(
            actor,
            {
                interval: 1,
                stackType: TaskStackType.NEVER,
                stackGroup: TaskStackGroup.ACTION,
                breakTypes: [ TaskBreakType.ON_MOVE ],
                immediate: false,
                repeat: true,
            }
        );

        // TODO (jkm) should this be in constructor? or on first execute?
        if (walkOnStart) {
            this.actor.pathfinding.walkTo(this.getTargetPosition(), { });
        }
    }

    /**
     * Every tick of the task, check if the actor has arrived at the destination.
     *
     * You can check `this.arrived` to see if the actor has arrived.
     *
     * If the actor has previously arrived at the destination, but is no longer within distance,
     * the task will be stopped.
     *
     * @returns `true` if the task was stopped this tick, `false` otherwise.
     *
     * TODO (jameskmonger) unit test this
     */
    public execute() {
        if (!this.isActive) {
            return;
        }

        const destination = this.getTargetPosition();

        // TODO this uses actual distances rather than tile distances
        //      is this correct?
        const withinDistance = this.actor.position.withinInteractionDistance(destination, this.distance)

        // the WalkToTask itself is complete when the actor has arrived at the destination
        // execution will now continue in the extended class
        if (this._atDestination) {
            // TODO consider making this optional
            if (!withinDistance) {
                this._atDestination = false;
                this.stop();
            }

            return;
        }

        if (withinDistance) {
            this._atDestination = true;

            if (this.onArrive) {
                this.onArrive();
            }
        }
    }

    private getTargetPosition(): Position {
        const destination: WalkToTargetType = typeof this.destination === 'function' ? this.destination() : this.destination;

        if(destination instanceof Position) {
            return destination;
        }

        return new Position(destination.x, destination.y);
    }
}
