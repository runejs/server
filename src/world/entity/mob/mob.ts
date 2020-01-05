import { Entity } from '../entity';
import { WalkingQueue } from './walking-queue';
import { ItemContainer } from './items/item-container';

/**
 * Handles a mobile entity within the game world.
 */
export abstract class Mob extends Entity {

    private _worldIndex: number;
    private readonly _walkingQueue: WalkingQueue;
    private _walkDirection: number;
    private _runDirection: number;
    private _faceDirection: number;
    private readonly _inventory: ItemContainer;

    protected constructor() {
        super();
        this._walkingQueue = new WalkingQueue(this);
        this._walkDirection = -1;
        this._runDirection = -1;
        this._faceDirection = -1;
        this._inventory = new ItemContainer(28);
    }

    public initiateRandomMovement(): void {
        setInterval(() => {
            const movementChance = Math.floor(Math.random() * 10);

            if(movementChance < 8) {
                return;
            }

            let px = this.position.x;
            let py = this.position.y;

            const moveXChance = Math.floor(Math.random() * 10);

            if(moveXChance > 6) {
                const moveXAmount = Math.floor(Math.random() * 5);
                const moveXMod = Math.floor(Math.random() * 2);

                if(moveXMod === 0) {
                    px -= moveXAmount;
                } else {
                    px += moveXAmount;
                }
            }

            const moveYChance = Math.floor(Math.random() * 10);

            if(moveYChance > 6) {
                const moveYAmount = Math.floor(Math.random() * 5);
                const moveYMod = Math.floor(Math.random() * 2);

                if(moveYMod === 0) {
                    py -= moveYAmount;
                } else {
                    py += moveYAmount;
                }
            }

            if(px !== this.position.x || py !== this.position.y) {
                this._walkingQueue.clear();
                this._walkingQueue.valid = true;
                this._walkingQueue.add(px, py);
            }
        }, 1000);
    }

    public get worldIndex(): number {
        return this._worldIndex;
    }

    public set worldIndex(value: number) {
        this._worldIndex = value;
    }

    public get walkingQueue(): WalkingQueue {
        return this._walkingQueue;
    }

    public get walkDirection(): number {
        return this._walkDirection;
    }

    public set walkDirection(value: number) {
        this._walkDirection = value;
    }

    public get runDirection(): number {
        return this._runDirection;
    }

    public set runDirection(value: number) {
        this._runDirection = value;
    }

    public get faceDirection(): number {
        return this._faceDirection;
    }

    public set faceDirection(value: number) {
        this._faceDirection = value;
    }

    public get inventory(): ItemContainer {
        return this._inventory;
    }
}
