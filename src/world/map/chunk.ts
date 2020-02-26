import { Position } from '../position';
import { Player } from '../actor/player/player';
import { CollisionMap } from './collision-map';
import { gameCache } from '../../game-server';
import { LandscapeObject, LandscapeObjectDefinition, MapRegionTile } from '@runejs/cache-parser';
import { Npc } from '../actor/npc/npc';
import { WorldItem } from '@server/world/items/world-item';

export interface ChunkUpdateItem {
    object?: LandscapeObject,
    worldItem?: WorldItem,
    type: 'ADD' | 'REMOVE'
}

/**
 * A single map chunk within the game world that keeps track of the entities within it.
 */
export class Chunk {

    private readonly _position: Position;
    private readonly _players: Player[];
    private readonly _npcs: Npc[];
    private readonly _collisionMap: CollisionMap;
    private readonly _tileList: MapRegionTile[];
    private readonly _cacheLandscapeObjects: Map<string, LandscapeObject>;
    private readonly _addedLandscapeObjects: Map<string, LandscapeObject>;
    private readonly _removedLandscapeObjects: Map<string, LandscapeObject>;
    private readonly _worldItems: Map<string, WorldItem[]>;

    public constructor(position: Position) {
        this._position = position;
        this._players = [];
        this._npcs = [];
        this._collisionMap = new CollisionMap(8, 8, (position.x + 6) * 8, (position.y + 6) * 8, this);
        this._tileList = [];
        this._cacheLandscapeObjects = new Map<string, LandscapeObject>();
        this._addedLandscapeObjects = new Map<string, LandscapeObject>();
        this._removedLandscapeObjects = new Map<string, LandscapeObject>();
        this._worldItems = new Map<string, WorldItem[]>();
    }

    public addWorldItem(worldItem: WorldItem): void {
        const key = worldItem.position.key;

        if(this._worldItems.has(key)) {
            const list = this._worldItems.get(key);
            list.push(worldItem);
            this._worldItems.set(key, list);
        } else {
            this._worldItems.set(worldItem.position.key, [worldItem]);
        }
    }

    public removeWorldItem(worldItem: WorldItem): void {
        const key = worldItem.position.key;

        if(this._worldItems.has(key)) {
            let list = this._worldItems.get(key);
            list.splice(list.indexOf(worldItem), 1);
            this._worldItems.set(key, list);
        }
    }

    public setCacheLandscapeObject(landscapeObject: LandscapeObject, objectPosition: Position): void {
        let tile = this.getTile(objectPosition);

        if(!tile) {
            tile = new MapRegionTile(objectPosition.x, objectPosition.y, objectPosition.level, 0);
            this.addTile(tile, objectPosition);
        }

        this.markOnCollisionMap(landscapeObject, objectPosition, true);
        this._cacheLandscapeObjects.set(`${objectPosition.x},${objectPosition.y},${landscapeObject.objectId}`, landscapeObject);
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

    public addNpc(npc: Npc): void {
        if(this._npcs.findIndex(n => n.equals(npc)) === -1) {
            this._npcs.push(npc);
        }
    }

    public removeNpc(npc: Npc): void {
        const index = this._npcs.findIndex(n => n.equals(npc));
        if(index !== -1) {
            this._npcs.splice(index, 1);
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

    public removeObject(object: LandscapeObject, position: Position, markRemoved: boolean = true): void {
        if(markRemoved && this.getCacheObject(object.objectId, position)) {
            // Only add this as an "removed" object if it's from the cache, as that's all we care about
            this.removedLandscapeObjects.set(`${position.x},${position.y},${object.objectId}`, object);
        }

        this.markOnCollisionMap(object, position, false);
    }

    public addObject(object: LandscapeObject, position: Position): void {
        if(!this.getCacheObject(object.objectId, position)) {
            // Only add this as an "added" object if there's not a cache object with the same id and position
            // This becomes a "custom" added object
            this.addedLandscapeObjects.set(`${position.x},${position.y},${object.objectId}`, object);
        }

        this.markOnCollisionMap(object, position, true);
    }

    public getCacheObject(objectId: number, position: Position): LandscapeObject {
        return this.cacheLandscapeObjects.get(`${position.x},${position.y},${objectId}`);
    }

    public getAddedObject(objectId: number, position: Position): LandscapeObject {
        return this.addedLandscapeObjects.get(`${position.x},${position.y},${objectId}`);
    }

    public getRemovedObject(objectId: number, position: Position): LandscapeObject {
        return this.removedLandscapeObjects.get(`${position.x},${position.y},${objectId}`);
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

    public get npcs(): Npc[] {
        return this._npcs;
    }

    public get collisionMap(): CollisionMap {
        return this._collisionMap;
    }

    public get tileList(): MapRegionTile[] {
        return this._tileList;
    }

    public get cacheLandscapeObjects(): Map<string, LandscapeObject> {
        return this._cacheLandscapeObjects;
    }

    public get addedLandscapeObjects(): Map<string, LandscapeObject> {
        return this._addedLandscapeObjects;
    }

    public get removedLandscapeObjects(): Map<string, LandscapeObject> {
        return this._removedLandscapeObjects;
    }

    public get worldItems(): Map<string, WorldItem[]> {
        return this._worldItems;
    }
}
