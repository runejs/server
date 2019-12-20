import { Entity } from '../entity';
import { WalkingQueue } from './walking-queue';

/**
 * Handles a mobile entity within the game world.
 */
export abstract class Mob extends Entity {

    private _worldIndex: number;
    private readonly _walkingQueue: WalkingQueue;
    private _walkDirection: number;
    private _runDirection: number;

    public constructor() {
        super();
        this._walkingQueue = new WalkingQueue(this);
        this._walkDirection = -1;
        this._runDirection = -1;
    }

    get worldIndex(): number {
        return this._worldIndex;
    }

    set worldIndex(value: number) {
        this._worldIndex = value;
    }

    get walkingQueue(): WalkingQueue {
        return this._walkingQueue;
    }

    get walkDirection(): number {
        return this._walkDirection;
    }

    set walkDirection(value: number) {
        this._walkDirection = value;
    }

    get runDirection(): number {
        return this._runDirection;
    }

    set runDirection(value: number) {
        this._runDirection = value;
    }
}
