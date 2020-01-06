import { WalkingQueue } from './walking-queue';
import { ItemContainer } from '../items/item-container';
import { UpdateFlags } from './update-flags';
import { Npc } from './npc/npc';
import { Entity } from '../entity';

/**
 * Handles a mobile entity within the game world.
 */
export abstract class Mob extends Entity {

    private _worldIndex: number;
    public readonly updateFlags: UpdateFlags;
    private readonly _walkingQueue: WalkingQueue;
    private _walkDirection: number;
    private _runDirection: number;
    private _faceDirection: number;
    private readonly _inventory: ItemContainer;

    protected constructor() {
        super();
        this.updateFlags = new UpdateFlags();
        this._walkingQueue = new WalkingQueue(this);
        this._walkDirection = -1;
        this._runDirection = -1;
        this._faceDirection = -1;
        this._inventory = new ItemContainer(28);
    }

    public initiateRandomMovement(): void {
        setInterval(() => {
            const movementChance = Math.floor(Math.random() * 10);

            if(movementChance < 7) {
                return;
            }

            let px: number;
            let py: number;
            let movementAllowed = false;

            while(!movementAllowed) {
                px = this.position.x;
                py = this.position.y;

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

                let valid = true;

                if(this instanceof Npc && (this as Npc).movementRadius) {
                    const npc = this as Npc;

                    if(px > npc.initialPosition.x + npc.movementRadius || px < npc.initialPosition.x - npc.movementRadius
                        || py > npc.initialPosition.y + npc.movementRadius || py < npc.initialPosition.y - npc.movementRadius) {
                        valid = false;
                    }
                }

                movementAllowed = valid;
            }

            if(px !== this.position.x || py !== this.position.y) {
                this._walkingQueue.clear();
                this._walkingQueue.valid = true;
                this._walkingQueue.add(px, py);
            }
        }, 1000);
    }

    public abstract equals(mob: Mob): boolean;

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
