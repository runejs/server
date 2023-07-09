import { Position } from '../position';
import { Actor } from './actor';

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
    private _facePosition: Position | null;
    private _faceActor: Actor | null;
    private _graphics: Graphic | null;
    private _animation: Animation | null;
    private _damage: Damage | null;

    public constructor() {
        this._chatMessages = [];
        this.reset();
    }

    public reset(): void {
        this._mapRegionUpdateRequired = false;
        this._appearanceUpdateRequired = false;
        this._facePosition = null;
        this._faceActor = null;
        this._graphics = null;
        this._animation = null;
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
            this._graphics !== null || (this._animation !== undefined && this._animation !== null) || (this._faceActor !== undefined && this._faceActor !== null) || this._damage !== null;
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

    public get facePosition(): Position | null {
        return this._facePosition;
    }

    public set facePosition(value: Position | null) {
        this._facePosition = value;
    }

    public get faceActor(): Actor | null {
        return this._faceActor;
    }

    public set faceActor(value: Actor | null) {
        this._faceActor = value;
    }

    public get graphics(): Graphic | null {
        return this._graphics;
    }

    public set graphics(value: Graphic | null) {
        this._graphics = value;
    }

    public get animation(): Animation | null {
        return this._animation;
    }

    public set animation(value: Animation | null) {
        this._animation = value;
    }

    public get damage(): Damage | null {
        return this._damage;
    }

    public set damage(value: Damage | null) {
        this._damage = value;
    }
}
