/**
 * Represents a single position, or coordinate, within the game world.
 */
export class Position {

    private _x: number;
    private _y: number;
    private _level: number;

    public constructor(x: number, y: number, level?: number) {
        this.move(x, y, level);
    }

    public move(x: number, y: number, level?: number) {
        this._x = x;
        this._y = y;

        if(level === undefined) {
            this._level = 0;
        } else {
            this._level = level;
        }
    }

    get chunkX(): number {
        return (this._x >> 3) - 6;
    }

    get chunkY(): number {
        return (this._y >> 3) - 6;
    }

    get chunkLocalX(): number {
        return this._x - 8 * this.chunkX;
    }

    get chunkLocalY(): number {
        return this._y - 8 * this.chunkY;
    }

    get x(): number {
        return this._x;
    }

    get y(): number {
        return this._y;
    }

    get level(): number {
        return this._level;
    }
}
