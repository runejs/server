import { Position } from '@engine/world';
import { Actor } from '@engine/world/actor';
import { ActorTask } from '@engine/task/impl/actor-task';

/**
 * A task for an actor to teleport to a new position.
 *
 * @author Kat
 */
export class ActorTeleportTask<TActor extends Actor = Actor> extends ActorTask<TActor> {
    private readonly _newPosition: Position;

    /**
     * @param actor The actor executing this task.
     * @param newPosition The position to teleport the actor to.
     */
    constructor (
        actor: TActor,
        newPosition: Position
    ) {
        super(actor, {
            repeat: false,
            immediate: false
        });
        this._newPosition = newPosition;
    }

    /**
     * Teleports the actor to the new position.
     *
     * TODO (Kat) unit test this
     */
    public execute() {
        if (!this.newPosition) {
            return;
        }

        this.actor.teleport(this.newPosition);
    }

    /**
     * Get the position the actor will be teleported to.
     *
     * @returns The position that the actor will be teleported to.
     */
    protected get newPosition(): Position | null {
        if (!this._newPosition) {
            return null;
        }

        return this._newPosition;
    }
}
