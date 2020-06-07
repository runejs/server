import { Position } from '../position';
import { Actor } from '@server/world/actor/actor';

/**
 * A specific chat message.
 */
export interface ChatMessage {
    color?: number;
    effects?: number;
    data?: Buffer;
    message?: string;
}

/**
 * A graphic.
 */
export interface Graphic {
    id: number;
    height: number;
    delay?: number;
}

/**
 * An animation.
 */
export interface Animation {
    id: number;
    delay?: number;
}

export enum DamageType {
    NO_DAMAGE = 0,
    DAMAGE = 1,
    POISON = 2
}

/**
 * An instance of damage.
 */
export interface Damage {
    damageDealt: number;
    damageType: DamageType;
    remainingHitpoints: number;
    maxHitpoints: number;
}

/**
 * Various player updating flags.
 */
export class UpdateFlags {

    private _mapRegionUpdateRequired: boolean;
    private _appearanceUpdateRequired: boolean;
    private _chatMessages: ChatMessage[];
    private _facePosition: Position;
    private _faceActor: Actor;
    private _graphics: Graphic;
    private _animation: Animation;
    private _damage: Damage;

    public constructor() {
        this._chatMessages = [];
        this.reset();
    }

    public reset(): void {
        this._mapRegionUpdateRequired = false;
        this._appearanceUpdateRequired = false;
        this._facePosition = null;
        this._faceActor = undefined;
        this._graphics = null;
        this._animation = undefined;
        this._damage = null;

        if(this._chatMessages.length !== 0) {
            this._chatMessages.shift();
        }
    }

    public addDamage(amount: number, type: DamageType, remainingHitpoints: number, maxHitpoints: number): void {
        this.damage = {
            damageDealt: amount,
            damageType: type,
            remainingHitpoints, maxHitpoints
        };
    }

    public addChatMessage(chatMessage: ChatMessage): void {
        if(this._chatMessages.length > 4) {
            return;
        }

        this._chatMessages.push(chatMessage);
    }

    public get updateBlockRequired(): boolean {
        return this._appearanceUpdateRequired || this._chatMessages.length !== 0 || this._facePosition !== null ||
            this._graphics !== null || this._animation !== undefined || this._faceActor !== undefined || this._damage !== null;
    }

    public get mapRegionUpdateRequired(): boolean {
        return this._mapRegionUpdateRequired;
    }

    public set mapRegionUpdateRequired(value: boolean) {
        this._mapRegionUpdateRequired = value;
    }

    public get appearanceUpdateRequired(): boolean {
        return this._appearanceUpdateRequired;
    }

    public set appearanceUpdateRequired(value: boolean) {
        this._appearanceUpdateRequired = value;
    }

    public get chatMessages(): ChatMessage[] {
        return this._chatMessages;
    }

    public set chatMessages(value: ChatMessage[]) {
        this._chatMessages = value;
    }

    public get facePosition(): Position {
        return this._facePosition;
    }

    public set facePosition(value: Position) {
        this._facePosition = value;
    }

    public get faceActor(): Actor {
        return this._faceActor;
    }

    public set faceActor(value: Actor) {
        this._faceActor = value;
    }

    public get graphics(): Graphic {
        return this._graphics;
    }

    public set graphics(value: Graphic) {
        this._graphics = value;
    }

    public get animation(): Animation {
        return this._animation;
    }

    public set animation(value: Animation) {
        this._animation = value;
    }

    public get damage(): Damage {
        return this._damage;
    }

    public set damage(value: Damage) {
        this._damage = value;
    }
}
