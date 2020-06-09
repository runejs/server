import { Position } from '../position';
import { Player } from '../actor/player/player';
import { CollisionMap } from './collision-map';
import { cache, world } from '../../game-server';
import { LocationObject, LocationObjectDefinition, Tile } from '@runejs/cache-parser';
import { Npc } from '../actor/npc/npc';
import { WorldItem } from '@server/world/items/world-item';

export interface ChunkUpdateItem {
    object?: LocationObject;
    worldItem?: WorldItem;
    type: 'ADD' | 'REMOVE';
}

/**
 * A single map chunk within the game world that keeps track of the entities within it.
 */
export class Chunk {

    private readonly _position: Position;
    private readonly _players: Player[];
    private readonly _npcs: Npc[];
    private readonly _collisionMap: CollisionMap;
    private readonly _tileList: Tile[];
    private readonly _cacheLocationObjects: Map<string, LocationObject>;
    private readonly _addedLocationObjects: Map<string, LocationObject>;
    private readonly _removedLocationObjects: Map<string, LocationObject>;
    private readonly _worldItems: Map<string, WorldItem[]>;

    public constructor(position: Position) {
        this._position = position;
        this._players = [];
        this._npcs = [];
        this._collisionMap = new CollisionMap(8, 8, (position.x + 6) * 8, (position.y + 6) * 8, this);
        this._tileList = [];
        this._cacheLocationObjects = new Map<string, LocationObject>();
        this._addedLocationObjects = new Map<string, LocationObject>();
        this._removedLocationObjects = new Map<string, LocationObject>();
        this._worldItems = new Map<string, WorldItem[]>();
    }

    public getWorldItem(itemId: number, position: Position): WorldItem {
        const key = position.key;

        if(this._worldItems.has(key)) {
            const list = this._worldItems.get(key);
            const worldItem = list.find(item => item.itemId === itemId);

            if(!worldItem) {
                return null;
            }

            return worldItem;
        }

        return null;
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
            const list = this._worldItems.get(key);
            list.splice(list.indexOf(worldItem), 1);
            this._worldItems.set(key, list);
        }
    }

    public setCacheLocationObject(locationObject: LocationObject, objectPosition: Position): void {
        let tile = this.getTile(objectPosition);

        if(!tile) {
            tile = new Tile(objectPosition.x, objectPosition.y, objectPosition.level);
            tile.bridge = false;
            tile.nonWalkable = false;
            this.addTile(tile, objectPosition);
        }

        if(tile.bridge) {
            // Move this marker down one level if it's on a bridge tile
            objectPosition.level = objectPosition.level - 1;
            const lowerChunk = world.chunkManager.getChunkForWorldPosition(objectPosition);
            locationObject.level -= 1;
            lowerChunk.markOnCollisionMap(locationObject, objectPosition, true);
            lowerChunk.cacheLocationObjects.set(`${ objectPosition.x },${ objectPosition.y },${ locationObject.objectId }`, locationObject);
        } else if(tile.bridge !== null) {
            this.markOnCollisionMap(locationObject, objectPosition, true);
            this._cacheLocationObjects.set(`${ objectPosition.x },${ objectPosition.y },${ locationObject.objectId }`, locationObject);
        }
    }

    public addTile(tile: Tile, tilePosition: Position): void {
        const existingTile = this.getTile(tilePosition);
        if(existingTile) {
            return;
        }

        if(tile.bridge) {
            // Move this tile down one level if it's a bridge tile
            const newTilePosition = new Position(tilePosition.x, tilePosition.y, tilePosition.level - 1);
            const lowerChunk = world.chunkManager.getChunkForWorldPosition(newTilePosition);
            const newTile = new Tile(tilePosition.x, tilePosition.y, tilePosition.level - 1);
            newTile.nonWalkable = tile.nonWalkable;
            newTile.bridge = null;
            lowerChunk.setTile(newTile, newTilePosition);
        }

        this._tileList.push(tile);
    }

    public getTile(position: Position): Tile {
        for(const tile of this._tileList) {
            if(position.equalsIgnoreLevel({ x: tile.x, y: tile.y })) {
                return tile;
            }
        }

        return null;
    }

    public findTile(position: Position): number {
        for(let i = 0; i < this._tileList.length; i++) {
            if(position.equalsIgnoreLevel({ x: this._tileList[i].x, y: this._tileList[i].y })) {
                return i;
            }
        }

        return -1;
    }

    public setTile(tile: Tile, tilePosition: Position): void {
        const existingTileIndex = this.findTile(tilePosition);

        if(existingTileIndex !== -1) {
            this._tileList.splice(existingTileIndex, 1);
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

    public markOnCollisionMap(locationObject: LocationObject, position: Position, mark: boolean): void {
        const x: number = position.x;
        const y: number = position.y;
        const objectType = locationObject.type;
        const objectOrientation = locationObject.orientation;
        const objectDetails: LocationObjectDefinition = cache.locationObjectDefinitions.get(locationObject.objectId);

        if(objectDetails.solid) {
            if(objectType === 22) {
                if(objectDetails.hasOptions) {
                    this.collisionMap.markBlocked(x, y, mark);
                }
            } else if(objectType >= 9) {
                this.collisionMap.markSolidOccupant(x, y, objectDetails.sizeX, objectDetails.sizeY, objectOrientation, objectDetails.nonWalkable, mark);
            } else if(objectType >= 0 && objectType <= 3) {
                if(mark) {
                    this.collisionMap.markWall(x, y, objectType, objectOrientation, objectDetails.nonWalkable);
                } else {
                    this.collisionMap.unmarkWall(x, y, objectType, objectOrientation, objectDetails.nonWalkable);
                }
            }
        }
    }

    public removeObject(object: LocationObject, position: Position, markRemoved: boolean = true): void {
        if(markRemoved && this.getCacheObject(object.objectId, position)) {
            // Only add this as an "removed" object if it's from the cache, as that's all we care about
            this.removedLocationObjects.set(`${position.x},${position.y},${object.objectId}`, object);
        }

        this.markOnCollisionMap(object, position, false);
    }

    public addObject(object: LocationObject, position: Position): void {
        if(!this.getCacheObject(object.objectId, position)) {
            // Only add this as an "added" object if there's not a cache object with the same id and position
            // This becomes a "custom" added object
            this.addedLocationObjects.set(`${position.x},${position.y},${object.objectId}`, object);
        }

        this.markOnCollisionMap(object, position, true);
    }

    public getCacheObject(objectId: number, position: Position): LocationObject {
        return this.cacheLocationObjects.get(`${position.x},${position.y},${objectId}`);
    }

    public getAddedObject(objectId: number, position: Position): LocationObject {
        return this.addedLocationObjects.get(`${position.x},${position.y},${objectId}`);
    }

    public getRemovedObject(objectId: number, position: Position): LocationObject {
        return this.removedLocationObjects.get(`${position.x},${position.y},${objectId}`);
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

    public get tileList(): Tile[] {
        return this._tileList;
    }

    public get cacheLocationObjects(): Map<string, LocationObject> {
        return this._cacheLocationObjects;
    }

    public get addedLocationObjects(): Map<string, LocationObject> {
        return this._addedLocationObjects;
    }

    public get removedLocationObjects(): Map<string, LocationObject> {
        return this._removedLocationObjects;
    }

    public get worldItems(): Map<string, WorldItem[]> {
        return this._worldItems;
    }
}
