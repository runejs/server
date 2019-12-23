import { Position } from '../position';
import { Player } from '../entity/mob/player/player';
import { CollisionMap } from './collision-map';
import { LandscapeObject, MapRegionTile } from '../../cache/map-regions/cache-map-regions';
import { world } from '../../game-server';
import { logger } from '../../util/logger';

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

        if(tile.bridge) {
            if(tile.level > 0) {
                const bridgeTileLevel = tile.level - 1;
                const bridgeTilePosition = new Position(tile.x, tile.y, bridgeTileLevel);
                const bridgeTileChunk = world.chunkManager.getChunkForWorldPosition(bridgeTilePosition);
                landscapeObject.level = bridgeTileLevel;
                objectPosition.level = bridgeTileLevel;

                bridgeTileChunk.markOnCollisionMap(landscapeObject, objectPosition, true);
            }
        } else {
            this.markOnCollisionMap(landscapeObject, objectPosition, true);
        }
    }

    public addTile(tile: MapRegionTile, tilePosition: Position): void {
        const existingTile = this.getTile(tilePosition);
        if(existingTile) {
            return;
        }

        this._tileList.push(tile);

        if(tile.bridge && tile.level > 0) {
            const bridgeTileLevel = tile.level - 1;
            const bridgeTilePosition = new Position(tile.x, tile.y, bridgeTileLevel);
            const bridgeTileChunk = world.chunkManager.getChunkForWorldPosition(bridgeTilePosition);
            bridgeTileChunk.replaceTile(tile, bridgeTilePosition);
        }
    }

    public getTile(position: Position): MapRegionTile {
        for(const tile of this._tileList) {
            if(position.equals({ x: tile.x, y: tile.y, level: tile.level })) {
                return tile;
            }
        }

        return null;
    }

    public replaceTile(tile: MapRegionTile, position: Position): void {
        const oldTileIndex = this._tileList.findIndex(t => position.equals({ x: t.x, y: t.y, level: t.level }));
        if(oldTileIndex !== -1) {
            this._tileList.splice(oldTileIndex, 1);
        }

        this._tileList.push(tile);
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
        const z: number = position.y;
        const objectType = landscapeObject.type;
        const objectRotation = landscapeObject.rotation;
        // const CacheGameObject cacheGameObject = landscapeObject.getCacheGameObject();

        if((x == 3240 && z == 3226)/* || (x == 3230 && z == 3225)*/) {
            logger.debug('chunk ' + this.position.x + ',' + this.position.y);
            logger.debug('obj is type ' + objectType);
        }

        // @TODO read object definitions from cache. needed for object sizing and metadata...
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
