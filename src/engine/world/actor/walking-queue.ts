import { regionChangeActionFactory } from '@engine/action/pipe/region-change.action';
import { activeWorld } from '@engine/world';
import { Npc } from '@engine/world/actor/npc';
import { Player } from '@engine/world/actor/player/player';
import { isNpc, isPlayer } from '@engine/world/actor/util';
import { Chunk } from '@engine/world/map/chunk';
import { Subject } from 'rxjs';
import { Position } from '../position';
import type { Actor } from './actor';

/**
 * Controls an actor's movement.
 */
export class WalkingQueue {
    public readonly movementQueued = new Subject<Position>();
    public readonly movementEvent = new Subject<Position>();
    public readonly movementQueued$ = this.movementQueued.asObservable();
    public readonly movementEvent$ = this.movementEvent.asObservable();

    private queue: Position[];
    private _valid: boolean;

    public constructor(private readonly actor: Actor) {
        this.queue = [];
        this._valid = false;
    }

    public moving(): boolean {
        return this.queue.length !== 0;
    }

    public clear(): void {
        this.queue = [];
    }

    public getLastPosition(): Position {
        if (this.queue.length === 0) {
            return this.actor.position;
        } else {
            return this.queue[this.queue.length - 1];
        }
    }

    public add(x: number, y: number, positionMetadata?: { [key: string]: any }): void {
        let lastPosition = this.getLastPosition();

        let lastX = lastPosition.x;
        let lastY = lastPosition.y;
        let diffX = x - lastX;
        let diffY = y - lastY;

        const stepsBetween = Math.max(Math.abs(diffX), Math.abs(diffY));

        for (let i = 0; i < stepsBetween; i++) {
            if (diffX !== 0) {
                diffX += diffX < 0 ? 1 : -1;
            }

            if (diffY !== 0) {
                diffY += diffY < 0 ? 1 : -1;
            }

            lastX = x - diffX;
            lastY = y - diffY;

            const newPosition = new Position(lastX, lastY, this.actor.position.level);

            if (this.actor.pathfinding.canMoveTo(lastPosition, newPosition)) {
                lastPosition = newPosition;
                newPosition.metadata = {
                    ...newPosition.metadata,
                    ...positionMetadata,
                };
                this.queue.push(newPosition);
                this.movementQueued.next(newPosition);
            } else {
                this.valid = false;
                break;
            }
        }

        if (lastX !== x || (lastY !== y && this.valid)) {
            const newPosition = new Position(x, y, this.actor.position.level);

            if (this.actor.pathfinding.canMoveTo(lastPosition, newPosition)) {
                newPosition.metadata = {
                    ...newPosition.metadata,
                    ...positionMetadata,
                };
                this.queue.push(newPosition);
                this.movementQueued.next(newPosition);
            } else {
                this.valid = false;
            }
        }
    }

    public moveIfAble(xDiff: number, yDiff: number): boolean {
        const position = this.actor.position;
        const newPosition = new Position(position.x + xDiff, position.y + yDiff, position.level);

        if (this.actor.pathfinding.canMoveTo(position, newPosition)) {
            this.clear();
            this.valid = true;
            this.add(newPosition.x, newPosition.y, { ignoreWidgets: true });
            return true;
        }

        return false;
    }

    public resetDirections(): void {
        this.actor.walkDirection = -1;
        this.actor.runDirection = -1;
    }

    public calculateDirection(diffX: number, diffY: number): number {
        if (diffX < 0) {
            if (diffY < 0) {
                return 5;
            } else if (diffY > 0) {
                return 0;
            } else {
                return 3;
            }
        } else if (diffX > 0) {
            if (diffY < 0) {
                return 7;
            } else if (diffY > 0) {
                return 2;
            } else {
                return 4;
            }
        } else {
            if (diffY < 0) {
                return 6;
            } else if (diffY > 0) {
                return 1;
            } else {
                return -1;
            }
        }
    }

    public process(): void {
        if (this.actor.busy || this.queue.length === 0 || !this.valid || this.actor.delayManager.isDelayed()) {
            this.resetDirections();
            return;
        }

        const walkPosition = this.queue.shift();
        if (!walkPosition) {
            return;
        }

        if (this.actor.metadata.faceActorClearedByWalking) {
            this.actor.clearFaceActor();
        }

        const originalPosition = this.actor.position;

        if (this.actor.pathfinding.canMoveTo(originalPosition, walkPosition)) {
            const oldChunk = activeWorld.chunkManager.getChunkForWorldPosition(originalPosition);
            const lastMapRegionUpdatePosition = this.actor.lastMapRegionUpdatePosition;

            const walkDiffX = walkPosition.x - originalPosition.x;
            const walkDiffY = walkPosition.y - originalPosition.y;
            const walkDir = this.calculateDirection(walkDiffX, walkDiffY);

            if (walkDir === -1) {
                this.resetDirections();
                return;
            }

            this.actor.lastMovementPosition = this.actor.position;
            this.actor.position = walkPosition;

            let runDir = -1;

            // Process running if enabled and more steps exist
            if (isPlayer(this.actor) && this.actor.settings.runEnabled && this.queue.length !== 0) {
                const runPosition = this.queue.shift();
                if (runPosition && this.actor.pathfinding.canMoveTo(walkPosition, runPosition)) {
                    const runDiffX = runPosition.x - walkPosition.x;
                    const runDiffY = runPosition.y - walkPosition.y;
                    runDir = this.calculateDirection(runDiffX, runDiffY);

                    if (runDir !== -1) {
                        this.actor.lastMovementPosition = this.actor.position;
                        this.actor.position = runPosition;
                    }
                }
            }

            this.actor.walkDirection = walkDir;
            this.actor.runDirection = runDir;
            this.actor.faceDirection = runDir !== -1 ? runDir : walkDir;

            const newChunk = activeWorld.chunkManager.getChunkForWorldPosition(this.actor.position);
            this.movementEvent.next(this.actor.position);

            this.handleChunkUpdate(oldChunk, newChunk, originalPosition);
        } else {
            this.resetDirections();
            this.clear();
        }
    }

    /**
     * Handles chunk updates and region changes when an actor moves between chunks
     * @param oldChunk The chunk the actor is moving from
     * @param newChunk The chunk the actor is moving to
     * @param originalPosition The actor's original position before movement
     */
    private handleChunkUpdate(oldChunk: Chunk, newChunk: Chunk, originalPosition: Position): void {
        if (!oldChunk.equals(newChunk)) {
            if (isPlayer(this.actor)) {
                // Handle map region updates for players
                const mapDiffX = this.actor.position.x - this.actor.lastMapRegionUpdatePosition.chunkX * 8;
                const mapDiffY = this.actor.position.y - this.actor.lastMapRegionUpdatePosition.chunkY * 8;

                if (mapDiffX < 16 || mapDiffX > 87 || mapDiffY < 16 || mapDiffY > 87) {
                    this.actor.updateFlags.mapRegionUpdateRequired = true;
                    this.actor.lastMapRegionUpdatePosition = this.actor.position;
                }

                // Update chunk references
                oldChunk.removePlayer(this.actor);
                newChunk.addPlayer(this.actor);
                this.actor.metadata.updateChunk = { newChunk, oldChunk };

                // Call region change action
                this.actor.actionPipeline.call(
                    'region_change',
                    regionChangeActionFactory(this.actor, originalPosition, this.actor.position),
                );
            } else if (isNpc(this.actor)) {
                // Handle NPC chunk updates
                oldChunk.removeNpc(this.actor);
                newChunk.addNpc(this.actor);
            }
        }
    }

    get valid(): boolean {
        return this._valid;
    }

    set valid(value: boolean) {
        this._valid = value;
    }
}
