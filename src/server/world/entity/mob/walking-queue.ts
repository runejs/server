import { Mob } from './mob';
import { Position } from '../../position';
import { Player } from './player/player';
import { world } from '../../../game-server';

export class WalkingQueue {

    private queue: Position[];
    private _valid: boolean;

    public constructor(private readonly mob: Mob) {
        this.queue = [];
        this._valid = false;
    }

    public clear(): void {
        this.queue = [];
    }

    public getLastPosition(): Position {
        if(this.queue.length === 0) {
            return this.mob.position;
        } else {
            return this.queue[this.queue.length - 1];
        }
    }

    public add(x: number, y: number): void {
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

            const newPosition = new Position(lastX, lastY);

            if(this.canMoveTo(lastPosition, newPosition)) {
                lastPosition = newPosition;
                this.queue.push(newPosition);
            } else {
                this.valid = false;
                break;
            }
        }

        if(lastX !== x || lastY !== y && this.valid) {
            const newPosition = new Position(x, y);

            if(this.canMoveTo(lastPosition, newPosition)) {
                this.queue.push(newPosition);
            } else {
                this.valid = false;
            }
        }
    }

    public canMoveTo(origin: Position, destination: Position): boolean {
        return true; // @TODO cache movement validation
    }

    private resetDirections(): void {
        this.mob.walkDirection = -1;
        this.mob.runDirection = -1;
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
        if(this.queue.length === 0 || !this.valid) {
            this.resetDirections();
            return;
        }

        const walkPosition = this.queue.shift();
        const currentPosition = this.mob.position;

        if(this.canMoveTo(currentPosition, walkPosition)) {
            // @TODO chunk updating
            const oldChunk = world.chunkManager.getChunkForWorldPosition(currentPosition);
            const lastMapRegionUpdatePosition = this.mob.lastMapRegionUpdatePosition;

            const walkDiffX = walkPosition.x - currentPosition.x;
            const walkDiffY = walkPosition.y - currentPosition.y;
            const walkDir = this.calculateDirection(walkDiffX, walkDiffY);

            if(walkDir === -1) {
                this.resetDirections();
                return;
            }

            this.mob.position = walkPosition;

            let runDir = -1;

            // @TODO running

            this.mob.walkDirection = walkDir;

            // @TODO NPC map region changing
            if(this.mob instanceof Player) {
                const newChunk = world.chunkManager.getChunkForWorldPosition(this.mob.position);

                if(!oldChunk.equals(newChunk)) {
                    oldChunk.removePlayer(this.mob);
                    newChunk.addPlayer(this.mob);
                }

                const mapDiffX = this.mob.position.x - (lastMapRegionUpdatePosition.chunkX * 8);
                const mapDiffY = this.mob.position.y - (lastMapRegionUpdatePosition.chunkY * 8);
                if(mapDiffX < 16 || mapDiffX > 87 || mapDiffY < 16 || mapDiffY > 87) {
                    this.mob.updateFlags.mapRegionUpdateRequired = true;
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
