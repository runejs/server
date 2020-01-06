import { Position } from '../position';

/**
 * Various player updating flags.
 */
export class UpdateFlags {

    private _mapRegionUpdateRequired: boolean;
    private _appearanceUpdateRequired: boolean;
    private _facePosition: Position;

    public constructor() {
        this.reset();
    }

    public reset(): void {
        this._mapRegionUpdateRequired = false;
        this._appearanceUpdateRequired = false;
        this._facePosition = null;
    }

    get updateBlockRequired(): boolean {
        return this._appearanceUpdateRequired || this._facePosition !== null;
    }

    get mapRegionUpdateRequired(): boolean {
        return this._mapRegionUpdateRequired;
    }

    set mapRegionUpdateRequired(value: boolean) {
        this._mapRegionUpdateRequired = value;
    }

    get appearanceUpdateRequired(): boolean {
        return this._appearanceUpdateRequired;
    }

    set appearanceUpdateRequired(value: boolean) {
        this._appearanceUpdateRequired = value;
    }

    public get facePosition(): Position {
        return this._facePosition;
    }

    public set facePosition(value: Position) {
        this._facePosition = value;
    }
}
