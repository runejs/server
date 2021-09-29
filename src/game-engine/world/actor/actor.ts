import { WalkingQueue } from './walking-queue';
import { ItemContainer } from '../items/item-container';
import { Animation, DamageType, Graphic, UpdateFlags } from './update-flags';
import { Npc } from './npc/npc';
import { Skill, Skills } from '@engine/world/actor/skills';
import { Item } from '@engine/world/items/item';
import { Position } from '@engine/world/position';
import { DirectionData, directionFromIndex } from '@engine/world/direction';
import { Pathfinding } from '@engine/world/actor/pathfinding';
import { Subject } from 'rxjs';
import { filter, take } from 'rxjs/operators';
import { world } from '@engine/game-server';
import { WorldInstance } from '@engine/world/instances';
import { Player } from '@engine/world/actor/player/player';
import { ActionCancelType, ActionPipeline } from '@engine/world/action/action-pipeline';
import { LandscapeObject } from '@runejs/filestore';
import { Behavior } from './behaviors/behavior';
import { soundIds } from '../config/sound-ids';
import { animationIds } from '../config/animation-ids';
import { findNpc } from '../../config/config-handler';
import { itemIds } from '../config/item-ids';
import { Attack, AttackDamageType } from './player/attack';
import { Effect, EffectType } from './effect';

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
    // #region Behaviors and Combat flags/checks
    public inCombat: boolean = false;
    public meleeDistance: number = 1;
    public Behaviors: Behavior[] = [];
    public isDead: boolean = false;
    public combatTargets: Actor[] = [];
    public hitPoints = this.skills.hitpoints.level * 4;
    public maxHitPoints = this.skills.hitpoints.level * 4;

    public get damageType() {
        return this._damageType;
    }
    public set damageType(value) {
        this._damageType = value;
    }
    public effects: Effect[] = []; //spells, effects, prayers, etc

    protected randomMovementInterval;
    /**
     * @deprecated - use new action system instead
     */
    private _busy: boolean;
    private _position: Position;
    private _lastMapRegionUpdatePosition: Position;
    private _worldIndex: number;
    private _walkDirection: number;
    private _runDirection: number;
    private _faceDirection: number;
    private _instance: WorldInstance = null;
    private _damageType = AttackDamageType.Crush;

    protected constructor() {
        this._walkDirection = -1;
        this._runDirection = -1;
        this._faceDirection = 6;
        this._busy = false;
    }

    public get highestCombatSkill(): Skill {
        const attack = this.skills.getLevel('attack');
        const magic = this.skills.getLevel('magic');
        const ranged = this.skills.getLevel('ranged');

        if (ranged > magic && ranged > ranged) return ranged;
        else if (magic > attack && magic > ranged) return magic;
        else return attack;
    }

    //https://oldschool.runescape.wiki/w/Attack_range#:~:text=All%20combat%20magic%20spells%20have,also%20allow%20longrange%20attack%20style
    // range should be within 10 tiles for magic
    // range should be within 7 for magic staff
    // https://www.theoatrix.net/post/how-defence-works-in-osrs
    // https://oldschool.runescape.wiki/w/Damage_per_second/Magic
    // https://oldschool.runescape.wiki/w/Successful_hit
    // https://oldschool.runescape.wiki/w/Combat_level#:~:text=Calculating%20combat%20level,-Simply&text=Add%20your%20Strength%20and%20Attack,have%20your%20melee%20combat%20level.&text=Multiply%20this%20by%200.325%20and,have%20your%20magic%20combat%20level
    // https://oldschool.runescape.wiki/w/Damage_per_second/Melee#:~:text=1%20Step%20one%3A%20Calculate%20the%20effective%20strength%20level%3B,1.7%20Step%20seven%3A%20Calculate%20the%20melee%20damage%20output
    public getAttackRoll(defender): Attack {
        
        //the amount of damage is random from 0 to Max
        //stance modifiers
        const _stance_defense = 3;
        const _stance_accurate = 0;
        const _stance_controlled = 1;
        
        // base level
        // ToDo: calculate prayer effects
        // round decimal result calulcation up
        // add 8
        // ToDo: add void bonues (effects)
        // round result down
        let equipmentBonus = 0;
        if (this.isPlayer) {
            const player = (this as unknown as Player);
            equipmentBonus = player.bonuses.offensive.crush;
        }
        if (equipmentBonus == 0) equipmentBonus = 1;
        /*
         * To calculate your maximum hit:

            Effective strength level
            Multiply by(Equipment Melee Strength + 64)
            Add 320 
            Divide by 640
            Round down to nearest integer
            Multiply by gear bonus
            Round down to nearest integer
        */
        const stanceModifier = _stance_accurate;
        const strengthLevel = (this.skills.attack.level + stanceModifier + 8);
        let attackCalc = strengthLevel * (equipmentBonus + 64) + 320;
        attackCalc = Math.round(attackCalc / 640);
        //console.log(`strengthLevel = ${strengthLevel} \r\n attackCalc = ${attackCalc} \r\n equipmentBonus = ${equipmentBonus}`);
        const maximumHit = Math.round(attackCalc * equipmentBonus);

        /*
            To calculate your effective attack level:

            (Attack level + Attack level boost) * prayer bonus
            Round down to nearest integer
            + 3 if using the accurate attack style, +1 if using controlled
                + 8
            Multiply by 1.1 if wearing void
            Round down to nearest integer
        */
        const attackLevel = this.skills.attack.level;
        let effectiveAttackLevel = attackLevel;

        //Prayer/Effect bonus - calculate ALL the good and bad effects at once! (prayers, and magic effects, etc.)
        this.effects.filter(a => a.EffectType === EffectType.Attack).forEach((effect) => {
            effectiveAttackLevel += (attackLevel * effect.Modifier);
        });
        effectiveAttackLevel = Math.round(effectiveAttackLevel) + stanceModifier;

        /*
         * Calculate the Attack roll
            Effective attack level * (Equipment Attack bonus + 64)
            Multiply by gear bonus
            Round down to nearest integer
         * */
        let attack = new Attack();
        attack.damageType = this.damageType ?? AttackDamageType.Crush;
        attack.attackRoll = Math.round(effectiveAttackLevel * (equipmentBonus + 64));
        attack = defender.getDefenseRoll(attack);
        attack.maximumHit = maximumHit;
        if (attack.attackRoll >= attack.defenseRoll) attack.hitChance = 1 - ((attack.defenseRoll + 2) / (2 * (attack.attackRoll + 1)))
        if (attack.attackRoll < attack.defenseRoll) attack.hitChance = attack.attackRoll / (2 * attack.defenseRoll + 1);

        attack.damage = Math.round((maximumHit * attack.hitChance) / 2);
        return attack;
    }
    public getDefenseRoll(attack: Attack): Attack {
        //attack need to know the damage roll, which is the item bonuses the weapon damage type etc.


        //stance modifiers
        const _stance_defense = 3;
        const _stance_accurate = 0;
        const _stance_controlled = 1;

        // base level
        // calculate prayer effects
        // round decimal result calulcation up
        // add 8
        // ToDo: add void bonues (effects)
        // round result down

        const equipmentBonus: number = this.isPlayer ? (this as unknown as Player).bonuses.defensive.crush : 0; //object prototyping to find property by name (JS style =/)

        const stanceModifier: number = _stance_accurate;


        attack.defenseRoll = (this.skills.defence.level + stanceModifier + 8) * (equipmentBonus + 64);
        //Prayer/Effect bonus - calculate ALL the good and bad effects at once! (prayers, and magic effects, etc.)
        this.effects.filter(a => a.EffectType === EffectType.BoostDefense || a.EffectType === EffectType.LowerDefense).forEach((effect) => {
            attack.defenseRoll += (this.skills.defence.level * effect.Modifier);
        });
        attack.defenseRoll = Math.round(attack.defenseRoll);
        return attack;
        //+ stance modifier
    }
    // #endregion  

    public damage(amount: number, damageType: DamageType = DamageType.DAMAGE) {
        const armorReduction = 0;
        const spellDamageReduction = 0;
        const poisonReistance = 0;
        amount -= armorReduction;
        this.hitPoints -= amount;
        this.skills.setHitpoints(this.hitPoints);
        this.updateFlags.addDamage(amount, amount === 0 ? DamageType.NO_DAMAGE : damageType,
            this.hitPoints, this.maxHitPoints);
        //this actor should respond when hit
        world.playLocationSound(this.position, soundIds.npc.human.noArmorHitPlayer,5)
        this.playAnimation(this.getBlockAnimation());
    }



    //public damage(amount: number, damageType: DamageType = DamageType.DAMAGE): 'alive' | 'dead' {
    //    let remainingHitpoints: number = this.skills.hitpoints.level - amount;
    //    const maximumHitpoints: number = this.skills.hitpoints.levelForExp;
    //    if(remainingHitpoints < 0) {
    //        remainingHitpoints = 0;
    //    }

    //    this.skills.setHitpoints(remainingHitpoints);
    //    this.updateFlags.addDamage(amount, amount === 0 ? DamageType.NO_DAMAGE : damageType,
    //        remainingHitpoints, maximumHitpoints);

    //    return remainingHitpoints === 0 ? 'dead' : 'alive';
    //}

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
