import { Direction, directionData } from '@server/world/direction';
import { LocationObject } from '@runejs/cache-parser';
import { cache } from '@server/game-server';

const directionDeltaX = [-1, 0, 1, -1, 1, -1, 0, 1];
const directionDeltaY = [1, 1, 1, 0, 0, -1, -1, -1];

/**
 * Represents a single position, or coordinate, within the game world.
 */
export class Position {

    private _x: number;
    private _y: number;
    private _level: number;
    public metadata: { [key: string]: any } = {};

    public constructor(x: number, y: number, level?: number) {
        this.move(x, y, level);
    }

    public clone(): Position {
        return new Position(this.x, this.y, this.level);
    }

    public withinInteractionDistance(locationObject: LocationObject): boolean {
        const definition = cache.locationObjectDefinitions.get(locationObject.objectId);
        const occupantX = locationObject.x;
        const occupantY = locationObject.y;
        let width = definition.sizeX;
        let height = definition.sizeY;

        if(width === undefined || width === null || width < 1) {
            width = 1;
        }
        if(height === undefined || height === null || height < 1) {
            height = 1;
        }

        if(width === 1 && height === 1) {
            return this.distanceBetween(new Position(occupantX, occupantY, locationObject.level)) <= 1;
        } else {
            if(locationObject.orientation == 1 || locationObject.orientation == 3) {
                const off = width;
                width = height;
                height = off;
            }

            for(let x = occupantX; x < occupantX + width; x++) {
                for(let y = occupantY; y < occupantY + height; y++) {
                    if(this.distanceBetween(new Position(x, y, locationObject.level)) <= 1) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    /**
     * Whether or not the specified position is within the game's view distance of this position.
     * @param position The game world position to check the distance of.
     */
    public withinViewDistance(position: Position): boolean {
        if(position.level !== this.level) {
            return false;
        }

        const offsetX = this.x - position.x;
        const offsetY = this.y - position.y;

        return offsetX < 16 && offsetY < 16 && offsetX > -16 && offsetY > -16;
    }

    public move(x: number, y: number, level?: number): void {
        this._x = x;
        this._y = y;

        if(level === undefined) {
            this._level = 0;
        } else {
            this._level = level;
        }
    }

    public equalsIgnoreLevel(position: Position | { x: number, y: number }): boolean {
        if(!(position instanceof Position)) {
            position = new Position(position.x, position.y);
        }

        return this._x === position.x && this._y === position.y;
    }

    public distanceBetween(other: Position): number {
        return Math.abs(Math.sqrt((this.x - other.x) * (this.x - other.x) + (this.y - other.y) * (this.y - other.y)));
    }

    public fromDirection(direction: number): Position {
        return new Position(this.x + directionDeltaX[direction], this.y + directionDeltaY[direction], this.level);
    }

    public step(steps: number, direction: Direction): Position {
        return new Position(this.x + (steps * directionData[direction].deltaX), this.y + (steps * directionData[direction].deltaY), this.level);
    }

    public copy(): Position {
        return new Position(this._x, this._y, this._level);
    }

    public equals(position: Position | { x: number, y: number, level: number }): boolean {
        if(!(position instanceof Position)) {
            position = new Position(position.x, position.y, position.level);
        }

        return this._x === position.x && this._y === position.y && this._level === position.level;
    }

    public get chunkX(): number {
        return (this._x >> 3) - 6;
    }

    public get chunkY(): number {
        return (this._y >> 3) - 6;
    }

    public get chunkLocalX(): number {
        return this._x - 8 * this.chunkX;
    }

    public get chunkLocalY(): number {
        return this._y - 8 * this.chunkY;
    }

    public get x(): number {
        return this._x;
    }

    public get y(): number {
        return this._y;
    }

    public get level(): number {
        return this._level;
    }

    public set x(value: number) {
        this._x = value;
    }

    public set y(value: number) {
        this._y = value;
    }

    public set level(value: number) {
        this._level = value;
    }

    public get key(): string {
        return `${this.x},${this.y},${this.level}`;
    }

}
