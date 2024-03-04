import { Subject } from 'rxjs';
import { filter, take } from 'rxjs/operators';

import { DefensiveBonuses, OffensiveBonuses, SkillBonuses } from '@engine/config';
import { activeWorld, directionFromIndex, Position, WorldInstance } from '@engine/world';
import { Item, ItemContainer } from '@engine/world/items';
import { ActionCancelType, ActionPipeline } from '@engine/action';

import { WalkingQueue } from './walking-queue';
import { Animation, Graphic, UpdateFlags } from './update-flags';
import { Skills } from './skills';
import { Pathfinding } from './pathfinding';
import { ActorMetadata } from './metadata';
import { Task, TaskScheduler } from '@engine/task';
import { logger } from '@runejs/common';


export type ActorType = 'player' | 'npc';


/**
 * Handles an entity within the game world.
 */
export abstract class Actor {

    public readonly type: ActorType;
    public readonly updateFlags: UpdateFlags = new UpdateFlags();
    public readonly skills: Skills = new Skills(this);
    public readonly walkingQueue: WalkingQueue = new WalkingQueue(this);
    public readonly inventory: ItemContainer = new ItemContainer(28);
    public readonly bank: ItemContainer = new ItemContainer(376);
    public readonly actionPipeline = new ActionPipeline(this);

    /**
     * The map of available metadata for this actor.
     *
     * You cannot guarantee that this will be populated with data, so you should always check for the existence of the
     * metadata you are looking for before using it.
     *
     * @author jameskmonger
     */
    public readonly metadata: Partial<ActorMetadata> = {};

    /**
     * @deprecated - use new action system instead
     */
    public readonly actionsCancelled: Subject<ActionCancelType> = new Subject<ActionCancelType>();

    public pathfinding: Pathfinding = new Pathfinding(this);
    public lastMovementPosition: Position;

    protected randomMovementInterval;
    protected _instance: WorldInstance | null = null;

    /**
     * Is this actor currently active? If true, the actor will have its task queue processed.
     *
     * This is true for players that are currently logged in, and NPCs that are currently in the world.
     */
    protected active: boolean;

    /**
     * @deprecated - use new action system instead
     */
    private _busy: boolean = false;
    private _position: Position;
    private _lastMapRegionUpdatePosition: Position;
    private _worldIndex: number;
    private _walkDirection: number;
    private _runDirection: number;
    private _faceDirection: number;
    private _bonuses: { offensive: OffensiveBonuses, defensive: DefensiveBonuses, skill: SkillBonuses };

    private readonly scheduler = new TaskScheduler();

    protected constructor(actorType: ActorType) {
        this.type = actorType;
        this._walkDirection = -1;
        this._runDirection = -1;
        this._faceDirection = 6;
        this.clearBonuses();
    }

    public abstract equals(actor: Actor): boolean;

    /**
     * Instantiate a task with the Actor instance and a set of arguments.
     *
     * @param taskClass The task class to instantiate. Must be a subclass of {@link Task}
     * @param args The arguments to pass to the task constructor
     *
     * If the task has a stack type of `NEVER`, other tasks in the same {@link TaskStackGroup} will be cancelled.
     */
    public enqueueTask(taskClass: new (actor: Actor) => Task, ...args: never[]): void;
    public enqueueTask<T1, T2, T3, T4, T5, T6>(taskClass: new (actor: Actor, arg1: T1, arg2: T2, arg3: T3, arg4: T4, arg5: T5, arg6: T6) => Task, args: [ T1, T2, T3, T4, T5, T6 ]): void;
    public enqueueTask<T1, T2, T3, T4, T5>(taskClass: new (actor: Actor, arg1: T1, arg2: T2, arg3: T3, arg4: T4, arg5: T5) => Task, args: [ T1, T2, T3, T4, T5 ]): void;
    public enqueueTask<T1, T2, T3, T4>(taskClass: new (actor: Actor, arg1: T1, arg2: T2, arg3: T3, arg4: T4) => Task, args: [ T1, T2, T3, T4 ]): void;
    public enqueueTask<T1, T2, T3>(taskClass: new (actor: Actor, arg1: T1, arg2: T2, arg3: T3) => Task, args: [ T1, T2, T3 ]): void;
    public enqueueTask<T1, T2>(taskClass: new (actor: Actor, arg1: T1, arg2: T2) => Task, args: [ T1, T2 ]): void;
    public enqueueTask<T1>(taskClass: new (actor: Actor, arg1: T1) => Task, args: [ T1 ]): void;
    public enqueueTask<T>(taskClass: new (actor: Actor, ...args: T[]) => Task, args: T[]): void {
        if (!this.active) {
            logger.warn(`Attempted to instantiate task for inactive actor`);
            return;
        }

        if (args) {
            this.enqueueBaseTask(
                new taskClass(this, ...args)
            );
        } else {
            this.enqueueBaseTask(
                new taskClass(this)
            );
        }
    }

    /**
     * Adds a task to the actor's scheduler queue. These tasks will be stopped when they become inactive.
     *
     * If the task has a stack type of `NEVER`, other tasks in the same group will be cancelled.
     *
     * @param task The task to add
     */
    public enqueueBaseTask(task: Task): void {
        if (!this.active) {
            logger.warn(`Attempted to enqueue task for  inactive actor`);
            return;
        }

        this.scheduler.enqueue(task);
    }

    /**
     * Instantly teleports the actor to the specified location.
     * @param newPosition The actor's new position.
     */
    public teleport(newPosition: Position): void {
        this.walkingQueue.clear();
        this.metadata['lastPosition'] = this.position.copy();
        this.position = newPosition;
        this.metadata.teleporting = true;
    }

    public clearBonuses(): void {
        this._bonuses = {
            offensive: {
                speed: 0, stab: 0, slash: 0, crush: 0, magic: 0, ranged: 0
            },
            defensive: {
                stab: 0, slash: 0, crush: 0, magic: 0, ranged: 0
            },
            skill: {
                strength: 0, prayer: 0
            }
        };
    }

    public async moveBehind(target: Actor): Promise<boolean> {
        if(this.position.level !== target.position.level) {
            return false;
        }

        const distance = Math.floor(this.position.distanceBetween(target.position));
        if(distance > 16) {
            this.clearFaceActor();
            return false;
        }

        let ignoreDestination = true;
        let desiredPosition = target.position;
        if(target.lastMovementPosition) {
            desiredPosition = target.lastMovementPosition;
            ignoreDestination = false;
        }

        await this.pathfinding.walkTo(desiredPosition, {
            pathingSearchRadius: distance + 2,
            ignoreDestination
        });

        return true;
    }

    public async moveTo(target: Actor): Promise<boolean> {
        if(this.position.level !== target.position.level) {
            return false;
        }

        const distance = Math.floor(this.position.distanceBetween(target.position));
        if(distance > 16) {
            this.clearFaceActor();
            return false;
        }

        await this.pathfinding.walkTo(target.position, {
            pathingSearchRadius: distance + 2,
            ignoreDestination: true
        });

        return true;
    }

    public follow(target: Actor): void {
        this.face(target, false, false, false);
        this.metadata.following = target;

        this.moveBehind(target);
        const subscription = target.walkingQueue.movementEvent.subscribe(() => {
            if(!this.moveBehind(target)) {
                // (Jameskmonger) actionsCancelled is deprecated, casting this to satisfy the typecheck for now
                this.actionsCancelled.next(null as unknown as ActionCancelType);
            }
        });

        this.actionsCancelled.pipe(
            filter(type => type !== 'pathing-movement'),
            take(1)
        ).subscribe(() => {
            subscription.unsubscribe();
            this.face(null);
            delete this.metadata.following;
        });
    }

    public async walkTo(target: Actor): Promise<boolean>;
    public async walkTo(position: Position): Promise<boolean>;
    public async walkTo(target: Actor | Position): Promise<boolean> {
        const desiredPosition = target instanceof Position ? target : target.position;

        const distance = Math.floor(this.position.distanceBetween(desiredPosition));

        if(distance <= 1) {
            return false;
        }

        if(distance > 16) {
            this.clearFaceActor();
            this.metadata.faceActorClearedByWalking = true;
            return false;
        }

        await this.pathfinding.walkTo(desiredPosition, {
            pathingSearchRadius: distance + 2,
            ignoreDestination: true
        });

        return true;
    }

    public face(face: Position | Actor | null, clearWalkingQueue: boolean = true, autoClear: boolean = true, clearedByWalking: boolean = true): void {
        if(face === null) {
            this.clearFaceActor();
            this.updateFlags.facePosition = null;
            return;
        }

        if(face instanceof Position) {
            this.updateFlags.facePosition = face;
        } else if(face instanceof Actor) {
            this.updateFlags.faceActor = face;
            this.metadata.faceActor = face;
            this.metadata.faceActorClearedByWalking = clearedByWalking;

            if(autoClear) {
                setTimeout(() => {
                    this.clearFaceActor();
                }, 20000);
            }
        }

        if(clearWalkingQueue) {
            this.walkingQueue.clear();
            this.walkingQueue.valid = false;
        }
    }

    public clearFaceActor(): void {
        if(this.metadata.faceActor) {
            this.updateFlags.faceActor = null;
            this.metadata.faceActor = undefined;
        }
    }

    public playAnimation(animation: number | Animation | null): void {
        if(typeof animation === 'number') {
            animation = { id: animation, delay: 0 };
        }

        this.updateFlags.animation = animation;
    }

    public stopAnimation(): void {
        this.updateFlags.animation = { id: -1, delay: 0 };
    }

    public playGraphics(graphics: number | Graphic): void {
        if(typeof graphics === 'number') {
            graphics = { id: graphics, delay: 0, height: 120 };
        }

        this.updateFlags.graphics = graphics;
    }

    public stopGraphics(): void {
        this.updateFlags.graphics = { id: -1, delay: 0, height: 120 };
    }

    public removeItem(slot: number): void {
        this.inventory.remove(slot);
    }

    public removeBankItem(slot: number): void {
        this.bank.remove(slot);
    }

    public giveItem(item: number | Item): boolean {
        return this.inventory.add(item) !== null;
    }
    public giveBankItem(item: number | Item): boolean {
        return this.bank.add(item) !== null;
    }

    public hasItemInInventory(item: number | Item): boolean {
        return this.inventory.has(item);
    }
    public hasItemInBank(item: number | Item): boolean {
        return this.bank.has(item);
    }

    public hasItemOnPerson(item: number | Item): boolean {
        return this.hasItemInInventory(item);
    }

    public canMove(): boolean {
        return !this.busy;
    }

    public initiateRandomMovement(): void {
        // this used to use `setInterval` but will need rewriting to be synced with ticks
        // see https://github.com/runejs/server/issues/417
        // this.randomMovementInterval = setInterval(() => this.moveSomewhere(), 1000);
    }

    public moveSomewhere(): void {
        if(!this.canMove()) {
            return;
        }

        if(this.isNpc) {
            const nearbyPlayers = activeWorld.findNearbyPlayers(this.position, 24, this.instance?.instanceId);
            if(nearbyPlayers.length === 0) {
                // No need for this actor to move if there are no players nearby to witness it, save some memory. :)
                return;
            }
        }

        const movementChance = Math.floor(Math.random() * 10);

        if(movementChance < 7) {
            return;
        }

        let px = this.position.x;
        let py = this.position.y;
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

            if(!this.withinBounds(px, py)) {
                valid = false;
            }

            movementAllowed = valid;
        }

        if(px !== this.position.x || py !== this.position.y) {
            this.walkingQueue.clear();
            this.walkingQueue.valid = true;
            this.walkingQueue.add(px, py);
        }
    }

    public forceMovement(direction: number, steps: number): void {
        if(!this.canMove()) {
            return;
        }

        let px = this.position.x;
        let py = this.position.y;
        let movementAllowed = false;

        while(!movementAllowed) {
            px = this.position.x;
            py = this.position.y;

            const movementDirection = directionFromIndex(direction);
            if(!movementDirection) {
                return;
            }
            let valid = true;
            for(let step = 0; step < steps; step++) {
                px += movementDirection.deltaX;
                py += movementDirection.deltaY;

                if(!this.withinBounds(px, py)) {
                    valid = false;
                }

            }

            movementAllowed = valid;
        }

        if(px !== this.position.x || py !== this.position.y) {
            this.walkingQueue.clear();
            this.walkingQueue.valid = true;
            this.walkingQueue.add(px, py);
        }
    }

    public withinBounds(x: number, y: number): boolean {
        return true;
    }

    /**
     * Initialise the actor.
     */
    protected init() {
        this.active = true;
    }

    /**
     * Destroy this actor.
     *
     * This will stop the processing of its action queue.
     */
    protected destroy() {
        this.active = false;

        this.scheduler.clear();
    }

    protected tick() {
        this.scheduler.tick();
    }

    public get position(): Position {
        return this._position;
    }

    public set position(value: Position) {
        if(!this._position) {
            this._lastMapRegionUpdatePosition = value;
        }

        this._position = value;
    }

    public get lastMapRegionUpdatePosition(): Position {
        return this._lastMapRegionUpdatePosition;
    }

    public set lastMapRegionUpdatePosition(value: Position) {
        this._lastMapRegionUpdatePosition = value;
    }

    public get worldIndex(): number {
        return this._worldIndex;
    }

    public set worldIndex(value: number) {
        this._worldIndex = value;
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

    public get busy(): boolean {
        return this._busy;
    }

    public set busy(value: boolean) {
        this._busy = value;
    }

    public get instance(): WorldInstance {
        return this._instance || activeWorld.globalInstance;
    }

    public set instance(value: WorldInstance | null) {
        this._instance = value;
    }

    public get isPlayer(): boolean {
        return this.type === 'player';
    }

    public get isNpc(): boolean {
        return this.type === 'npc';
    }

    public get bonuses(): { offensive: OffensiveBonuses, defensive: DefensiveBonuses, skill: SkillBonuses } {
        return this._bonuses;
    }
}
