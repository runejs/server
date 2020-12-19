import { Position } from '../position';
import { Player } from '../actor/player/player';
import { CollisionMap } from './collision-map';
import { world } from '../../game-server';
import { LocationObject } from '@runejs/cache-parser';
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
    private readonly _cacheLocationObjects: Map<string, LocationObject>;

    public constructor(position: Position) {
        this._position = position;
        this._players = [];
        this._npcs = [];
        this._collisionMap = new CollisionMap(position.x, position.y, position.level, { chunk: this });
        this._cacheLocationObjects = new Map<string, LocationObject>();
        this.registerMapRegion();
    }

    public registerMapRegion(): void {
        const mapRegionX = Math.floor(this.position.x / 8);
        const mapRegionY = Math.floor(this.position.y / 8);
        world.chunkManager.registerMapRegion(mapRegionX, mapRegionY);
    }

    public setCacheLocationObject(locationObject: LocationObject): void {
        this._collisionMap.markGameObject(locationObject, true);
        this._cacheLocationObjects.set(`${ locationObject.x },${ locationObject.y },${ locationObject.objectId }`, locationObject);
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

    public getCacheObject(objectId: number, position: Position): LocationObject {
        return this.cacheLocationObjects.get(`${position.x},${position.y},${objectId}`);
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

    public get cacheLocationObjects(): Map<string, LocationObject> {
        return this._cacheLocationObjects;
    }
}
