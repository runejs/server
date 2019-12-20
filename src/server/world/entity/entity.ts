import { Position } from '../position';

export abstract class Entity {

    private _position: Position;
    private _lastMapRegionUpdatePosition: Position;

    get position(): Position {
        return this._position;
    }

    set position(value: Position) {
        if(!this._position) {
            this._lastMapRegionUpdatePosition = value;
        }

        this._position = value;
    }

    get lastMapRegionUpdatePosition(): Position {
        return this._lastMapRegionUpdatePosition;
    }

    set lastMapRegionUpdatePosition(value: Position) {
        this._lastMapRegionUpdatePosition = value;
    }
}
