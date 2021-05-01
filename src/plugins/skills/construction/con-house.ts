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

    public getRoomData(): number[][][] {
        const roomData = new Array(4);
        for(let level = 0; level < 4; level++) {
            roomData[level] = new Array(MAP_SIZE);
            for(let x = 0; x < MAP_SIZE; x++) {
                roomData[level][x] = new Array(MAP_SIZE);
                for(let y = 0; y < MAP_SIZE; y++) {
                    roomData[level][x][y] = this.rooms[level][x][y]?.roomData || null;
                }
            }
        }

        return roomData;
    }

    public getRoom(position: Position): Room {
        return this.rooms[position.level][position.x][position.y];
    }

}


export class Room {

    public readonly type: RoomType;

    public orientation: number;

    public constructor(type: RoomType, orientation: number = 0) {
        this.type = type;
        this.orientation = orientation;
    }

    public get roomData(): number {
        const { x, y, level } = roomTemplates[this.type];
        return x / 8 << 14 | y / 8 << 3 | level % 4 << 24 | this.orientation % 4 << 1;
    }

}
