import { Position } from '../position';

/**
 * A specific chat message.
 */
export interface ChatMessage {
    color: number;
    effects: number;
    data: Buffer;
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

/**
 * Various player updating flags.
 */
export class UpdateFlags {

    private _mapRegionUpdateRequired: boolean;
    private _appearanceUpdateRequired: boolean;
    private _chatMessages: ChatMessage[];
    private _facePosition: Position;
    private _graphics: Graphic;
    private _animation: Animation;

    public constructor() {
        this._chatMessages = [];
        this.reset();
    }

    public reset(): void {
        this._mapRegionUpdateRequired = false;
        this._appearanceUpdateRequired = false;
        this._facePosition = null;
        this._graphics = null;
        this._animation = null;

        if(this._chatMessages.length !== 0) {
            this._chatMessages.shift();
        }
    }

    public addChatMessage(chatMessage: ChatMessage): void {
        if(this._chatMessages.length > 4) {
            return;
        }

        this._chatMessages.push(chatMessage);
    }

    public get updateBlockRequired(): boolean {
        return this._appearanceUpdateRequired || this._chatMessages !== null || this._facePosition !== null ||
            this._graphics !== null || this._animation !== null;
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
}
