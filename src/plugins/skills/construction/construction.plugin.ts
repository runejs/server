import { Position } from '@engine/world/position';
import { Player } from '@engine/world/actor/player/player';
import { PlayerCommandAction } from '@engine/world/action/player-command.action';
import { playerInitActionHandler } from '@engine/world/action/player-init.action';
import { World } from '@engine/world';
import { world } from '@engine/game-server';
import { schedule } from '@engine/world/task';


const MAX_HOUSE_SIZE = 13;


type RoomType = 'empty' | 'empty_grass' | 'garden_1' | 'garden_2' | 'parlor';


type RoomTemplateMap = {
    [key in RoomType]: Position;
}


const roomTemplates: RoomTemplateMap = {
    empty:        new Position(1856, 5056),
    empty_grass:  new Position(1864, 5056),
    garden_1:     new Position(1856, 5064),
    garden_2:     new Position(1872, 5064),
    parlor:       new Position(1856, 5112),
};


class Room {

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


const pohCoords = new Position(2048, 6272);

const pohMin = new Position(2016, 6240);
const pohMax = new Position(2079, 6303);


const openHouse = async (player: Player): Promise<void> => {
    const syntheticPlane = Math.floor(Math.random() * 64) * 4;
    const pohLocation = pohCoords.copy().setLevel(syntheticPlane);
    // if(!player.position.within(pohMin, pohMax, false)) {
        player.teleport(pohLocation.copy());
    // } else {
    //     player.teleport(player.position.copy().setLevel(syntheticPlane));
    // }

    player.sendMessage(pohLocation.key);

    const house = new House();

    const gardenPortal = new Room('garden_1');
    const firstParlor = new Room('parlor');
    const emptySpace = new Room('empty_grass');

    for(let x = 0; x < MAX_HOUSE_SIZE; x++) {
        for(let y = 0; y < MAX_HOUSE_SIZE; y++) {
            if(x <= 1 || y <= 1 || x >= 10 || y >= 10) {
                continue;
            }

            if(x === 6 && y === 6) {
                house.rooms[0][x][y] = gardenPortal;
            } else if(x === 7 && y === 6) {
                house.rooms[0][x][y] = firstParlor;
            } else {
                house.rooms[0][x][y] = emptySpace;
            }
        }
    }

    player.outgoingPackets.constructHouseMaps(pohLocation, house.getRoomData());
    player.metadata.customMap = true;
};


const playerInitHomeCheck: playerInitActionHandler = ({ player }): void => {
    if(player.position.within(pohMin, pohMax, false)) {
        // @TODO TEMPORARY FOR TESTING!!!
        setTimeout(() => openHouse(player), World.TICK_LENGTH);
    }
};


export default {
    pluginId: 'rs:construction',
    hooks: [
        {
            type: 'player_command',
            commands: [ 'con' ],
            handler: ({ player }: PlayerCommandAction): void => {
                openHouse(player)
            }
        },
        {
            type: 'player_init',
            handler: playerInitHomeCheck
        }
    ]
};
