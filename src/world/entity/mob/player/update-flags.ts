/**
 * Various player updating flags.
 */
export class UpdateFlags {

    private _mapRegionUpdateRequired: boolean;
    private _appearanceUpdateRequired: boolean;

    public constructor() {
        this.reset();
    }

    public reset(): void {
        this._mapRegionUpdateRequired = false;
        this._appearanceUpdateRequired = false;
    }

    get updateBlockRequired(): boolean {
        return this._appearanceUpdateRequired;
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
}
