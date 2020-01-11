import { Position } from '../position';

/**
 * A specific chat message.
 */
export interface ChatMessage {
    color: number;
    effects: number;
    data: number[];
}

/**
 * Various player updating flags.
 */
export class UpdateFlags {

    private _mapRegionUpdateRequired: boolean;
    private _appearanceUpdateRequired: boolean;
    private _chatMessage: ChatMessage;
    private _facePosition: Position;

    public constructor() {
        this.reset();
    }

    public reset(): void {
        this._mapRegionUpdateRequired = false;
        this._appearanceUpdateRequired = false;
        this._chatMessage = null;
        this._facePosition = null;
    }

    public get updateBlockRequired(): boolean {
        return this._appearanceUpdateRequired || this._chatMessage !== null || this._facePosition !== null;
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

    public get chatMessage(): ChatMessage {
        return this._chatMessage;
    }

    public set chatMessage(value: ChatMessage) {
        this._chatMessage = value;
    }

    public get facePosition(): Position {
        return this._facePosition;
    }

    public set facePosition(value: Position) {
        this._facePosition = value;
    }
}
