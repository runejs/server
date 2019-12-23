import { Position } from '../position';
import { Player } from '../entity/mob/player/player';
import { CollisionMap } from './collision-map';
import { LandscapeObject, MapRegionTile } from '../../cache/map-regions/cache-map-regions';
import { gameCache } from '../../game-server';
import { LandscapeObjectDefinition } from '../../cache/definitions/landscape-object-definitions';

/**
 * A single map chunk within the game world that keeps track of the entities within it.
 */
export class Chunk {

    private readonly _position: Position;
    private readonly _players: Player[];
    private readonly _collisionMap: CollisionMap;
    private readonly _tileList: MapRegionTile[];

    public constructor(position: Position) {
        this._position = position;
        this._players = [];
        this._collisionMap = new CollisionMap(8, 8, (position.x + 6) * 8, (position.y + 6) * 8, this);
        this._tileList = [];
    }

    public addObjectToCollisionMap(landscapeObject: LandscapeObject, objectPosition: Position): void {
        let tile = this.getTile(objectPosition);

        if(!tile) {
            tile = new MapRegionTile(objectPosition.x, objectPosition.y, objectPosition.level, 0);
            this.addTile(tile, objectPosition);
        }

        this.markOnCollisionMap(landscapeObject, objectPosition, true);
    }

    public addTile(tile: MapRegionTile, tilePosition: Position): void {
        const existingTile = this.getTile(tilePosition);
        if(existingTile) {
            return;
        }

        this._tileList.push(tile);
    }

    public getTile(position: Position): MapRegionTile {
        for(const tile of this._tileList) {
            if(position.equalsIgnoreLevel({ x: tile.x, y: tile.y })) {
                return tile;
            }
        }

        return null;
    }

    public addPlayer(player: Player): void {
        if(this._players.findIndex(p => p.equals(player)) === -1) {
            this._players.push(player);
        }
    }

    public removePlayer(player: Player): void {
        const index = this._players.findIndex(p => p.equals(player));
        if(index !== -1) {
            this._players.splice(index, 1);
        }
    }

    public markOnCollisionMap(landscapeObject: LandscapeObject, position: Position, mark: boolean): void {
        const x: number = position.x;
        const y: number = position.y;
        const objectType = landscapeObject.type;
        const objectRotation = landscapeObject.rotation;
        const objectDetails: LandscapeObjectDefinition = gameCache.landscapeObjectDefinitions.get(landscapeObject.objectId);

        if(objectDetails.solid) {
            if(objectType === 22) {
                if(objectDetails.hasOptions) {
                    this.collisionMap.markBlocked(x, y, mark);
                }
            } else if(objectType >= 9) {
                this.collisionMap.markSolidOccupant(x, y, objectDetails.sizeX, objectDetails.sizeY, objectRotation, objectDetails.walkable, mark);
            } else if(objectType >= 0 && objectType <= 3) {
                if(mark) {
                    this.collisionMap.markWall(x, y, objectType, objectRotation, objectDetails.walkable);
                } else {
                    this.collisionMap.unmarkWall(x, y, objectType, objectRotation, objectDetails.walkable);
                }
            }
        }
    }

    public equals(chunk: Chunk): boolean {
        return this.position.x === chunk.position.x && this.position.y === chunk.position.y && this.position.level === chunk.position.level;
    }

    public get position(): Position {
        return this._position;
    }

    public get players(): Player[] {
        return this._players;
    }

    public get collisionMap(): CollisionMap {
        return this._collisionMap;
    }

    public get tileList(): MapRegionTile[] {
        return this._tileList;
    }
}
