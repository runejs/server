import { Position } from '@engine/world/position';
import { Player } from '@engine/world/actor/player/player';
import { PlayerCommandAction } from '@engine/world/action/player-command.action';


const MAX_HOUSE_SIZE = 13;


type RoomType = 'empty' | 'empty_grass' | 'garden_1' | 'garden_2' | 'parlor';


class House {

    public readonly rooms: Room[][][];

    public constructor() {
        this.rooms = new Array(4);
        for(let level = 0; level < 4; level++) {
            this.rooms[level] = new Array(MAX_HOUSE_SIZE);
            for(let x = 0; x < MAX_HOUSE_SIZE; x++) {
                this.rooms[level][x] = new Array(MAX_HOUSE_SIZE).fill(null);
            }
        }
    }

    public getRoomData(): number[][][] {
        const roomData = new Array(4);
        for(let level = 0; level < 4; level++) {
            roomData[level] = new Array(MAX_HOUSE_SIZE);
            for(let x = 0; x < MAX_HOUSE_SIZE; x++) {
                roomData[level][x] = new Array(MAX_HOUSE_SIZE);
                for(let y = 0; y < MAX_HOUSE_SIZE; y++) {
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


interface RoomTemplate {
    room: string;
    worldPosition: Position;
}


class Room {

    public template: RoomTemplate;
    public orientation: number;

    public get roomData(): number {
        const { x, y, level } = this.template.worldPosition;
        return x / 8 << 14 | y / 8 << 3 | level % 4 << 24 | this.orientation % 4 << 1;
    }

}


const homeLocation = new Position(2048, 6272, 0);


const roomTemplates: RoomTemplate[] = [
    {
        room: 'empty',
        worldPosition: new Position(1856, 5056, 0)
    },
    {
        room: 'empty_grass',
        worldPosition: new Position(1864, 5056, 0)
    },
    {
        room: 'garden_1',
        worldPosition: new Position(1856, 5064, 0)
    },
    {
        room: 'garden_2',
        worldPosition: new Position(1872, 5064, 0)
    },
    {
        room: 'parlor',
        worldPosition: new Position(1856, 5112, 0)
    }
];


const openHouse = (player: Player): void => {
    player.updateFlags.autoChunkUpdate = false;
    player.teleport(homeLocation.clone());

    const house = new House();

    const firstRoom = new Room();
    firstRoom.template = {
        room: 'garden_1',
        worldPosition: new Position(1856, 5064, 0)
    };
    firstRoom.orientation = 0;

    const emptyRoom = new Room();
    emptyRoom.template = {
        room: 'empty_grass',
        worldPosition: new Position(1864, 5056, 0)
    };
    emptyRoom.orientation = 0;

    for(let x = 0; x < MAX_HOUSE_SIZE; x++) {
        for(let y = 0; y < MAX_HOUSE_SIZE; y++) {
            if(x <= 1 || y <= 1 || x >= 10 || y >= 10) {
                continue;
            }

            if(x === 6 && y === 6) {
                house.rooms[0][x][y] = firstRoom;
            } else {
                house.rooms[0][x][y] = emptyRoom;
            }
        }
    }

    player.outgoingPackets.constructHouseMaps(house.getRoomData());
    player.updateFlags.mapRegionUpdateRequired = true;
};


export default {
    pluginId: 'rs:construction',
    hooks: [
        {
            type: 'player_command',
            commands: [ 'con' ],
            handler: ({ player }: PlayerCommandAction): void => openHouse(player)
        }
    ]
};
