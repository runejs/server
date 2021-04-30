import { Position } from '@engine/world/position';
import { Player } from '@engine/world/actor/player/player';
import { PlayerCommandAction } from '@engine/world/action/player-command.action';
import { PlayerInitAction, playerInitActionHandler } from '@engine/world/action/player-init.action';
import { World } from '@engine/world';
import { world } from '@engine/game-server';
import { schedule } from '@engine/world/task';
import { ConstructedMap } from '@engine/world/map/region';


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


const instance1 = new Position(6400, 6400);
const instance1PohSpawn = new Position(6400 + 36, 6400 + 36);
const instance1Max = new Position(6400 + 64, 6400 + 64);

const instance2 = new Position(6400, 6464);
const instance2PohSpawn = new Position(6400 + 36, 6464 + 36);
const instance2Max = new Position(6400 + 64, 6464 + 64);



const openHouse = async (player: Player): Promise<void> => {
    player.sendMessage(player.position.key);
    player.sendMessage(`${player.position.chunkLocalX},${player.position.chunkLocalY}`);

    const house = new House();

    const gardenPortal = new Room('garden_1');
    const firstParlor = new Room('parlor');
    const emptySpace = new Room('empty_grass');

    for(let x = 0; x < MAX_HOUSE_SIZE; x++) {
        for(let y = 0; y < MAX_HOUSE_SIZE; y++) {
            if(x === 6 && y === 6) {
                house.rooms[0][x][y] = gardenPortal;
            } else if((x === 7 && y === 6) || (x === 6 && y === 7) || (x === 5 && y === 6)) {
                house.rooms[0][x][y] = firstParlor;
            }
        }
    }

    let pohPosition: Position = instance1;
    let playerSpawn: Position = instance1PohSpawn;

    if(player.position.within(instance1, instance1Max, false)) {
        playerSpawn = player.position.copy().setY(player.position.y + 64);
        pohPosition = instance2;
    } else if(player.position.within(instance2, instance2Max, false)) {
        playerSpawn = player.position.copy().setY(player.position.y - 64);
    }

    player.teleport(playerSpawn);

    player.metadata.customMap = {
        position: pohPosition,
        emptySpace: emptySpace.roomData,
        tileData: house.getRoomData()
    } as ConstructedMap;

    player.sendMessage(player.position.key);
    player.sendMessage(`${player.position.chunkLocalX},${player.position.chunkLocalY}`);

    player.sendMessage(`Welcome home.`);
};


const playerInitHomeCheck = async (player: Player): Promise<void> =>
    await openHouse(player);


export default {
    pluginId: 'rs:construction',
    hooks: [
        {
            type: 'player_command',
            commands: [ 'con' ],
            handler: ({ player }: PlayerCommandAction): void => {
                openHouse(player);
            }
        },
        {
            type: 'player_command',
            commands: [ 'local' ],
            handler: ({ player }: PlayerCommandAction): void => {
                player.sendMessage(player.position.key);
                player.sendMessage(`${player.position.chunkLocalX},${player.position.chunkLocalY}`);
            }
        },
        {
            type: 'player_init',
            handler: ({ player }: PlayerInitAction): void => {
                playerInitHomeCheck(player);
            }
        }
    ]
};
