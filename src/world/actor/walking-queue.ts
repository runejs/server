import { Actor } from './actor';
import { Position } from '../position';
import { Player } from './player/player';
import { world } from '@server/game-server';
import { Chunk } from '../map/chunk';
import { Tile } from '@runejs/cache-parser';
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

            if(this.canMoveTo(lastPosition, newPosition)) {
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

            if(this.canMoveTo(lastPosition, newPosition)) {
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

        if(this.canMoveTo(position, newPosition)) {
            this.clear();
            this.valid = true;
            this.add(newPosition.x, newPosition.y, { ignoreWidgets: true });
            return true;
        }

        return false;
    }

    public canMoveTo(origin: Position, destination: Position): boolean {
        let destinationChunk: Chunk = world.chunkManager.getChunkForWorldPosition(destination);
        const positionAbove: Position = new Position(destination.x, destination.y, destination.level + 1);
        const chunkAbove: Chunk = world.chunkManager.getChunkForWorldPosition(positionAbove);
        let tile: Tile = chunkAbove.getTile(positionAbove);

        if(!tile || !tile.bridge) {
            tile = destinationChunk.getTile(destination);
        } else {
            // Destination is a bridge, so we need to check the chunk above to get the bridge tiles instead of the level we're currently on
            destinationChunk = chunkAbove;
        }

        if(tile) {
            if(tile.nonWalkable) {
                return false;
            }
        }

        const initialX: number = origin.x;
        const initialY: number = origin.y;
        const destinationAdjacency: number[][] = destinationChunk.collisionMap.adjacency;
        const destinationLocalX: number = destination.x - destinationChunk.collisionMap.insetX;
        const destinationLocalY: number = destination.y - destinationChunk.collisionMap.insetY;

        // @TODO check objects moving from bridge tile to non bridge tile
        // ^ currently possible to clip through some bridge walls thanks to this issue
        // not the most important thing since you still can't walk on water or anything

        // West
        if(destination.x < initialX && destination.y == initialY) {
            if((destinationAdjacency[destinationLocalX][destinationLocalY] & 0x1280108) != 0) {
                // logger.warn(`${this.actor instanceof Player ? this.actor.username + ' c' : 'C'}an not move west.`);
                return false;
            }
        }

        // East
        if(destination.x > initialX && destination.y == initialY) {
            if((destinationAdjacency[destinationLocalX][destinationLocalY] & 0x1280180) != 0) {
                // logger.warn(`${this.actor instanceof Player ? this.actor.username + ' c' : 'C'}an not move east.`);
                return false;
            }
        }

        // South
        if(destination.y < initialY && destination.x == initialX) {
            if((destinationAdjacency[destinationLocalX][destinationLocalY] & 0x1280102) != 0) {
                // logger.warn(`${this.actor instanceof Player ? this.actor.username + ' c' : 'C'}an not move south.`);
                return false;
            }
        }

        // North
        if(destination.y > initialY && destination.x == initialX) {
            if((destinationAdjacency[destinationLocalX][destinationLocalY] & 0x1280120) != 0) {
                // logger.warn(`${this.actor instanceof Player ? this.actor.username + ' c' : 'C'}an not move north.`);
                return false;
            }
        }

        // South-West
        if(destination.x < initialX && destination.y < initialY) {
            if(!this.canMoveDiagonally(origin, destinationAdjacency, destinationLocalX, destinationLocalY, initialX, initialY, -1, -1,
                0x128010e, 0x1280108, 0x1280102)) {
                // logger.warn(`${this.actor instanceof Player ? this.actor.username + ' c' : 'C'}an not move south-west.`);
                return false;
            }
        }

        // South-East
        if(destination.x > initialX && destination.y < initialY) {
            if(!this.canMoveDiagonally(origin, destinationAdjacency, destinationLocalX, destinationLocalY, initialX, initialY, 1, -1,
                0x1280183, 0x1280180, 0x1280102)) {
                // logger.warn(`${this.actor instanceof Player ? this.actor.username + ' c' : 'C'}an not move south-east.`);
                return false;
            }
        }

        // North-West
        if(destination.x < initialX && destination.y > initialY) {
            if(!this.canMoveDiagonally(origin, destinationAdjacency, destinationLocalX, destinationLocalY, initialX, initialY, -1, 1,
                0x1280138, 0x1280108, 0x1280120)) {
                // logger.warn(`${this.actor instanceof Player ? this.actor.username + ' c' : 'C'}an not move north-west.`);
                return false;
            }
        }

        // North-East
        if(destination.x > initialX && destination.y > initialY) {
            if(!this.canMoveDiagonally(origin, destinationAdjacency, destinationLocalX, destinationLocalY, initialX, initialY, 1, 1,
                0x12801e0, 0x1280180, 0x1280120)) {
                // logger.warn(`${this.actor instanceof Player ? this.actor.username + ' c' : 'C'}an not move north-east.`);
                return false;
            }
        }

        return true;
    }

    private canMoveDiagonally(origin: Position, destinationAdjacency: number[][], destinationLocalX: number, destinationLocalY: number,
                              initialX: number, initialY: number, offsetX: number, offsetY: number, destMask: number, cornerMask1: number, cornerMask2: number): boolean {
        const cornerX1: number = initialX + offsetX;
        const cornerY1: number = initialY;
        const cornerX2: number = initialX;
        const cornerY2: number = initialY + offsetY;
        const corner1 = this.calculateLocalCornerPosition(cornerX1, cornerY1, origin);
        const corner2 = this.calculateLocalCornerPosition(cornerX2, cornerY2, origin);

        return ((destinationAdjacency[destinationLocalX][destinationLocalY] & destMask) == 0 &&
            (corner1.chunk.collisionMap.adjacency[corner1.localX][corner1.localY] & cornerMask1) == 0 &&
            (corner2.chunk.collisionMap.adjacency[corner2.localX][corner2.localY] & cornerMask2) == 0);
    }

    private calculateLocalCornerPosition(cornerX: number, cornerY: number, origin: Position): { localX: number, localY: number, chunk: Chunk } {
        const cornerPosition: Position = new Position(cornerX, cornerY, origin.level + 1);
        let cornerChunk: Chunk = world.chunkManager.getChunkForWorldPosition(cornerPosition);
        const tileAbove: Tile = cornerChunk.getTile(cornerPosition);
        if(!tileAbove || !tileAbove.bridge) {
            cornerPosition.level = cornerPosition.level - 1;
            cornerChunk = world.chunkManager.getChunkForWorldPosition(cornerPosition);
        }
        const localX: number = cornerX - cornerChunk.collisionMap.insetX;
        const localY: number = cornerY - cornerChunk.collisionMap.insetY;

        return { localX, localY, chunk: cornerChunk };
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
        if(this.actor.busy || this.queue.length === 0 || !this.valid) {
            this.resetDirections();
            return;
        }

        const walkPosition = this.queue.shift();

        if(this.actor instanceof Player) {
            this.actor.actionsCancelled.next(true);

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

        this.actor.clearFaceActor();

        const currentPosition = this.actor.position;

        if(this.canMoveTo(currentPosition, walkPosition)) {
            const oldChunk = world.chunkManager.getChunkForWorldPosition(currentPosition);
            const lastMapRegionUpdatePosition = this.actor.lastMapRegionUpdatePosition;

            const walkDiffX = walkPosition.x - currentPosition.x;
            const walkDiffY = walkPosition.y - currentPosition.y;
            const walkDir = this.calculateDirection(walkDiffX, walkDiffY);

            if(walkDir === -1) {
                this.resetDirections();
                return;
            }

            this.actor.position = walkPosition;

            let runDir = -1;

            // @TODO npc running
            if(this.actor instanceof Player) {
                if(this.actor.settings.runEnabled && this.queue.length !== 0) {
                    const runPosition = this.queue.shift();

                    if(this.canMoveTo(walkPosition, runPosition)) {
                        const runDiffX = runPosition.x - walkPosition.x;
                        const runDiffY = runPosition.y - walkPosition.y;
                        runDir = this.calculateDirection(runDiffX, runDiffY);

                        if(runDir != -1) {
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
