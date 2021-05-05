import { Position } from '../position';
import { Player } from '../actor/player/player';
import { CollisionMap } from './collision-map';
import { world } from '../../game-server';
import { Npc } from '../actor/npc/npc';
import { WorldItem } from '@engine/world/items/world-item';
import { LandscapeObject } from '@runejs/filestore';


interface CustomLandscapeObject {
    reference?: boolean;
}

export interface ChunkUpdateItem {
    object?: LandscapeObject & CustomLandscapeObject;
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
    private readonly _filestoreLandscapeObjects: Map<string, LandscapeObject>;

    public constructor(position: Position) {
        this._position = position;
        this._players = [];
        this._npcs = [];
        this._collisionMap = new CollisionMap(position.x, position.y, position.level, { chunk: this });
        this._filestoreLandscapeObjects = new Map<string, LandscapeObject>();
    }

    public registerMapRegion(): void {
        const mapRegionX = Math.floor((this.position.x + 6) / 8);
        const mapRegionY = Math.floor((this.position.y + 6) / 8);
        world.chunkManager.registerMapRegion(mapRegionX, mapRegionY);
    }

    public setFilestoreLandscapeObject(landscapeObject: LandscapeObject): void {
        this._filestoreLandscapeObjects.set(`${ landscapeObject.x },${ landscapeObject.y },${ landscapeObject.objectId }`,
            landscapeObject);
        this._collisionMap.markGameObject(landscapeObject, true);
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

    public getFilestoreLandscapeObject(objectId: number, position: Position): LandscapeObject {
        return this.filestoreLandscapeObjects.get(`${position.x},${position.y},${objectId}`);
    }

    public equals(chunk: Chunk): boolean {
        return this.position.x === chunk.position.x && this.position.y === chunk.position.y
            && this.position.level === chunk.position.level;
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

    public get filestoreLandscapeObjects(): Map<string, LandscapeObject> {
        return this._filestoreLandscapeObjects;
    }
}
