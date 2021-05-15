import { MAP_SIZE, roomTemplates, RoomType } from '@plugins/skills/construction/con-constants';
import { Position } from '@engine/world/position';
import { ConstructedChunk } from '@engine/world/map/region';


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

}


export class Room extends ConstructedChunk {

    public readonly type: RoomType;

    public constructor(type: RoomType, rotation: number = 0) {
        super(rotation);
        this.type = type;
    }

    public getTemplatePosition(): Position {
        return roomTemplates[this.type];
    }

}
