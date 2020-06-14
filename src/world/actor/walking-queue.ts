import { Actor } from './actor';
import { Position } from '../position';
import { Player } from './player/player';
import { world } from '@server/game-server';
import { Npc } from './npc/npc';

/**
 * Controls an actor's movement.
 */
export class WalkingQueue {

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
        if(this.queue.length === 0) {
            return this.actor.position;
        } else {
            return this.queue[this.queue.length - 1];
        }
    }

    public add(x: number, y: number, positionMetadata?: { [key: string ]: any}): void {
        let lastPosition = this.getLastPosition();

        let lastX = lastPosition.x;
        let lastY = lastPosition.y;
        let diffX = x - lastX;
        let diffY = y - lastY;

        const stepsBetween = Math.max(Math.abs(diffX), Math.abs(diffY));

        for(let i = 0; i < stepsBetween; i++) {
            if(diffX !== 0) {
                diffX += diffX < 0 ? 1 : -1;
            }

            if(diffY !== 0) {
                diffY += diffY < 0 ? 1 : -1;
            }

            lastX = x - diffX;
            lastY = y - diffY;

            const newPosition = new Position(lastX, lastY, this.actor.position.level);

            if(this.actor.pathfinding.canMoveTo(lastPosition, newPosition)) {
                lastPosition = newPosition;
                newPosition.metadata = positionMetadata;
                this.queue.push(newPosition);
            } else {
                this.valid = false;
                break;
            }
        }

        if(lastX !== x || lastY !== y && this.valid) {
            const newPosition = new Position(x, y, this.actor.position.level);

            if(this.actor.pathfinding.canMoveTo(lastPosition, newPosition)) {
                newPosition.metadata = positionMetadata;
                this.queue.push(newPosition);
            } else {
                this.valid = false;
            }
        }
    }

    public moveIfAble(xDiff: number, yDiff: number): boolean {
        const position = this.actor.position;
        const newPosition = new Position(position.x + xDiff, position.y + yDiff, position.level);

        if(this.actor.pathfinding.canMoveTo(position, newPosition)) {
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
        if(diffX < 0) {
            if(diffY < 0) {
                return 5;
            } else if(diffY > 0) {
                return 0;
            } else {
                return 3;
            }
        } else if(diffX > 0) {
            if(diffY < 0) {
                return 7;
            } else if(diffY > 0) {
                return 2;
            } else {
                return 4;
            }
        } else {
            if(diffY < 0) {
                return 6;
            } else if(diffY > 0) {
                return 1;
            } else {
                return -1;
            }
        }
    }

    public process(): void {
        if(!world.ready || this.actor.busy || this.queue.length === 0 || !this.valid) {
            this.resetDirections();
            return;
        }

        const walkPosition = this.queue.shift();

        if(this.actor instanceof Player) {
            this.actor.actionsCancelled.next('pathing-movement');

            const activeWidget = this.actor.activeWidget;
            if(activeWidget && (!walkPosition.metadata || !walkPosition.metadata.ignoreWidgets)) {
                if(activeWidget.disablePlayerMovement) {
                    this.resetDirections();
                    return;
                } else if(activeWidget.closeOnWalk) {
                    if(activeWidget.forceClosed !== undefined) {
                        activeWidget.forceClosed();
                    }

                    this.actor.activeWidget = null;
                }
            }
        }

        if(this.actor.metadata['faceActorClearedByWalking'] === undefined || this.actor.metadata['faceActorClearedByWalking']) {
            this.actor.clearFaceActor();
        }

        const currentPosition = this.actor.position;

        if(this.actor.pathfinding.canMoveTo(currentPosition, walkPosition)) {
            const oldChunk = world.chunkManager.getChunkForWorldPosition(currentPosition);
            const lastMapRegionUpdatePosition = this.actor.lastMapRegionUpdatePosition;

            const walkDiffX = walkPosition.x - currentPosition.x;
            const walkDiffY = walkPosition.y - currentPosition.y;
            const walkDir = this.calculateDirection(walkDiffX, walkDiffY);

            if(walkDir === -1) {
                this.resetDirections();
                return;
            }

            this.actor.lastMovementPosition = this.actor.position;
            this.actor.position = walkPosition;

            let runDir = -1;

            // @TODO npc running
            if(this.actor instanceof Player) {
                if(this.actor.settings.runEnabled && this.queue.length !== 0) {
                    const runPosition = this.queue.shift();

                    if(this.actor.pathfinding.canMoveTo(walkPosition, runPosition)) {
                        const runDiffX = runPosition.x - walkPosition.x;
                        const runDiffY = runPosition.y - walkPosition.y;
                        runDir = this.calculateDirection(runDiffX, runDiffY);

                        if(runDir != -1) {
                            this.actor.lastMovementPosition = this.actor.position;
                            this.actor.position = runPosition;
                        }
                    } else {
                        this.resetDirections();
                        this.clear();
                    }
                }
            }

            this.actor.walkDirection = walkDir;
            this.actor.runDirection = runDir;

            if(runDir !== -1) {
                this.actor.faceDirection = runDir;
            } else {
                this.actor.faceDirection = walkDir;
            }

            const newChunk = world.chunkManager.getChunkForWorldPosition(this.actor.position);

            this.actor.movementEvent.next(this.actor.position);

            if(this.actor instanceof Player) {
                const mapDiffX = this.actor.position.x - (lastMapRegionUpdatePosition.chunkX * 8);
                const mapDiffY = this.actor.position.y - (lastMapRegionUpdatePosition.chunkY * 8);
                if(mapDiffX < 16 || mapDiffX > 87 || mapDiffY < 16 || mapDiffY > 87) {
                    this.actor.updateFlags.mapRegionUpdateRequired = true;
                    this.actor.lastMapRegionUpdatePosition = this.actor.position;
                }
            }

            if(!oldChunk.equals(newChunk)) {
                if(this.actor instanceof Player) {
                    this.actor.metadata['updateChunk'] = { newChunk, oldChunk };
                } else if(this.actor instanceof Npc) {
                    oldChunk.removeNpc(this.actor);
                    newChunk.addNpc(this.actor);
                }
            }
        } else {
            this.resetDirections();
            this.clear();
        }
    }

    get valid(): boolean {
        return this._valid;
    }

    set valid(value: boolean) {
        this._valid = value;
    }
}
