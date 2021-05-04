import { MAP_SIZE, roomTemplates, RoomType } from '@plugins/skills/construction/con-constants';
import { Position } from '@engine/world/position';


export class House {

    public readonly rooms: Room[][][];

    public constructor() {
        this.rooms = new Array(4);
        for(let level = 0; level < 4; level++) {
            this.rooms[level] = new Array(MAP_SIZE);
            for(let x = 0; x < MAP_SIZE; x++) {
                this.rooms[level][x] = new Array(MAP_SIZE).fill(null);
            }
        }
    }

    public getRoom(position: Position): Room {
        return this.rooms[position.level][position.x][position.y];
    }

}


export class Room {

    public readonly type: RoomType;

    public rotation: number;

    public constructor(type: RoomType, orientation: number = 0) {
        this.type = type;
        this.rotation = orientation;
    }

    public get position(): Position {
        return roomTemplates[this.type];
    }

}
