import { WalkingQueue } from './walking-queue';
import { ItemContainer } from '../items/item-container';
import { Animation, DamageType, Graphic, UpdateFlags } from './update-flags';
import { Npc } from './npc/npc';
import { Skills } from '@engine/world/actor/skills';
import { Item } from '@engine/world/items/item';
import { Position } from '@engine/world/position';
import { DirectionData, directionFromIndex } from '@engine/world/direction';
import { Pathfinding } from '@engine/world/actor/pathfinding';
import { Subject } from 'rxjs';
import { filter, take } from 'rxjs/operators';
import { world } from '@engine/game-server';
import { WorldInstance } from '@engine/world/instances';
import { Player } from '@engine/world/actor/player/player';
import { ActionCancelType, ActionPipeline } from '@engine/world/action';
import { LandscapeObject } from '@runejs/filestore';


/**
 * Handles an actor within the game world.
 */
export abstract class Actor {

    public readonly updateFlags: UpdateFlags = new UpdateFlags();
    public readonly skills: Skills = new Skills(this);
    public readonly walkingQueue: WalkingQueue = new WalkingQueue(this);
    public readonly inventory: ItemContainer = new ItemContainer(28);
    public readonly bank: ItemContainer = new ItemContainer(376);
    public readonly actionPipeline = new ActionPipeline(this);
    public readonly metadata: { [key: string]: any } = {};

    /**
     * @deprecated - use new action system instead
     */
    public readonly actionsCancelled: Subject<ActionCancelType> = new Subject<ActionCancelType>();

    public pathfinding: Pathfinding = new Pathfinding(this);
    public lastMovementPosition: Position;

    protected randomMovementInterval;

    private _position: Position;
    private _lastMapRegionUpdatePosition: Position;
    private _worldIndex: number;
    private _walkDirection: number;
    private _runDirection: number;
    private _faceDirection: number;
    private _instance: WorldInstance = null;

    /**
     * @deprecated - use new action system instead
     */
    private _busy: boolean;

    protected constructor() {
        this._walkDirection = -1;
        this._runDirection = -1;
        this._faceDirection = 6;
        this._busy = false;
    }

    public damage(amount: number, damageType: DamageType = DamageType.DAMAGE): 'alive' | 'dead' {
        let remainingHitpoints: number = this.skills.hitpoints.level - amount;
        const maximumHitpoints: number = this.skills.hitpoints.levelForExp;
        if(remainingHitpoints < 0) {
            remainingHitpoints = 0;
        }

        this.skills.setHitpoints(remainingHitpoints);
        this.updateFlags.addDamage(amount, amount === 0 ? DamageType.NO_DAMAGE : damageType,
            remainingHitpoints, maximumHitpoints);

        return remainingHitpoints === 0 ? 'dead' : 'alive';
    }

    /**
     * Waits for the actor to reach the specified position before resolving it's promise.
     * The promise will be rejected if the actor's walking queue changes or their movement is otherwise canceled.
     * @param position The position that the actor needs to reach for the promise to resolve.
     */
    public async waitForPathing(position: Position): Promise<void>;

    /**
     * Waits for the actor to reach the specified game object before resolving it's promise.
     * The promise will be rejected if the actor's walking queue changes or their movement is otherwise canceled.
     * @param gameObject The game object to wait for the actor to reach.
     */
    public async waitForPathing(gameObject: LandscapeObject): Promise<void>;

    /**
     * Waits for the actor to reach the specified game object before resolving it's promise.
     * The promise will be rejected if the actor's walking queue changes or their movement is otherwise canceled.
     * @param target The position or game object that the actor needs to reach for the promise to resolve.
     */
    public async waitForPathing(target: Position | LandscapeObject): Promise<void>;
    public async waitForPathing(target: Position | LandscapeObject): Promise<void> {
        if(this.position.withinInteractionDistance(target)) {
            return;
        }

        await new Promise<void>((resolve, reject) => {
            this.metadata.walkingTo = target instanceof Position ? target : new Position(target.x, target.y, target.level);

            const inter = setInterval(() => {
                if(!this.metadata.walkingTo || !this.metadata.walkingTo.equals(target)) {
                    reject();
                    clearInterval(inter);
                    return;
                }

                if(!this.walkingQueue.moving()) {
                    if(target instanceof Position) {
                        if(this.position.distanceBetween(target) > 1) {
                            reject();
                        } else {
                            resolve();
                        }
                    } else {
                        if(this.position.withinInteractionDistance(target)) {
                            resolve();
                        } else {
                            reject();
                        }
                    }

                    clearInterval(inter);
                    this.metadata.walkingTo = null;
                }
            }, 100);
        });
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
        this.metadata['following'] = target;

        this.moveBehind(target);
        const subscription = target.walkingQueue.movementEvent.subscribe(() => {
            if(!this.moveBehind(target)) {
                this.actionsCancelled.next(null);
            }
        });

        this.actionsCancelled.pipe(
            filter(type => type !== 'pathing-movement'),
            take(1)
        ).subscribe(() => {
            subscription.unsubscribe();
            this.face(null);
            delete this.metadata['following'];
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

    public tail(target: Actor): void {
        this.face(target, false, false, false);

        if(this.metadata.tailing && this.metadata.tailing.equals(target)) {
            return;
        }

        this.metadata['tailing'] = target;

        this.moveTo(target);
        const subscription = target.walkingQueue.movementEvent.subscribe(async () => this.moveTo(target));

        this.actionsCancelled.pipe(
            filter(type => type !== 'pathing-movement'),
            take(1)
        ).subscribe(() => {
            subscription.unsubscribe();
            this.face(null);
            delete this.metadata['tailing'];
        });
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
            this.metadata['faceActor'] = face;
            this.metadata['faceActorClearedByWalking'] = clearedByWalking;

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
        if(this.metadata['faceActor']) {
            this.updateFlags.faceActor = null;
            this.metadata['faceActor'] = undefined;
        }
    }

    public playAnimation(animation: number | Animation): void {
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
        this.randomMovementInterval = setInterval(() => this.moveSomewhere(), 1000);
    }

    public moveSomewhere(): void {
        if(!this.canMove()) {
            return;
        }

        if(this instanceof Npc) {
            const nearbyPlayers = world.findNearbyPlayers(this.position, 24, this.instanceId);
            if(nearbyPlayers.length === 0) {
                // No need for this NPC to move if there are no players nearby to see it
                return;
            }
        }

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

            if(this instanceof Npc) {
                if(px > this.initialPosition.x + this.movementRadius || px < this.initialPosition.x - this.movementRadius
                    || py > this.initialPosition.y + this.movementRadius || py < this.initialPosition.y - this.movementRadius) {
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

    public forceMovement(direction: number, steps: number): void {
        if(!this.canMove()) {
            return;
        }

        let px: number;
        let py: number;
        let movementAllowed = false;

        while(!movementAllowed) {
            px = this.position.x;
            py = this.position.y;

            const movementDirection: DirectionData = directionFromIndex(direction);
            if(!movementDirection) {
                return;
            }
            let valid = true;
            for(let step = 0; step < steps; step++) {
                px += movementDirection.deltaX;
                py += movementDirection.deltaY;

                if(this instanceof Npc) {
                    if(px > this.initialPosition.x + this.movementRadius || px < this.initialPosition.x - this.movementRadius
                        || py > this.initialPosition.y + this.movementRadius || py < this.initialPosition.y - this.movementRadius) {
                        valid = false;
                    }
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

    public abstract getAttackAnimation(): number;
    public abstract getBlockAnimation(): number;
    public abstract equals(actor: Actor): boolean;

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
        return this._instance || world.globalInstance;
    }

    public set instance(value: WorldInstance) {
        if(this instanceof Player) {
            const currentInstance = this._instance;
            if(currentInstance?.instanceId) {
                currentInstance.removePlayer(this);
            }

            if(value) {
                value.addPlayer(this);
            }
        }

        this._instance = value;
    }

    public get isPlayer(): boolean {
        return this instanceof Player;
    }

    public get isNpc(): boolean {
        return this instanceof Npc;
    }

    public get type(): { player?: Player, npc?: Npc } {
        return {
            player: this.isPlayer ? this as unknown as Player : undefined,
            npc: this.isNpc ? this as unknown as Npc : undefined
        };
    }

}
