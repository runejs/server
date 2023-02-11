import {
    instance1, instance1Max,
    instance1PohSpawn, instance2, instance2Max,
    MAP_SIZE, roomTemplates, RoomType
} from '@plugins/skills/construction/con-constants';
import { Position } from '@engine/world/position';
import { ConstructedChunk, ConstructedRegion } from '@engine/world/map/region';
import { Player } from '@engine/world/actor/player/player';
import { loadHouse } from '@plugins/skills/construction/home-saver';
import { activeWorld } from '@engine/world';


export const openHouse = (player: Player): void => {
    let pohPosition: Position = instance1;
    let playerSpawn: Position = instance1PohSpawn;

    if(player.position.within(instance1, instance1Max, false)) {
        playerSpawn = player.position.copy().setY(player.position.y + 64);
        pohPosition = instance2;
    } else if(player.position.within(instance2, instance2Max, false)) {
        playerSpawn = player.position.copy().setY(player.position.y - 64);
    }

    const playerHouse = loadHouse(player);

    if(playerHouse) {
        player.metadata.customMap = {
            renderPosition: pohPosition,
            chunks: playerHouse.rooms
        } as ConstructedRegion;
    }

    player.teleport(playerSpawn);

    if(!player.metadata.customMap) {
        const house = new House();
        house.rooms[0][6][6] = new Room('garden');

        player.metadata.customMap = {
            renderPosition: pohPosition,
            chunks: house.rooms
        } as ConstructedRegion;
    } else {
        player.metadata.customMap.renderPosition = pohPosition;
    }

    for(let plane = 0; plane < 3; plane++) {
        for(let chunkX = 0; chunkX < 13; chunkX++) {
            for(let chunkY = 0; chunkY < 13; chunkY++) {
                const room = player.metadata.customMap.chunks[plane][chunkX][chunkY];
                if(!room) {
                    continue;
                }

                const templatePosition = room.templatePosition;

                // load all the PoH template maps into memory so that their collision maps are generated
                activeWorld.chunkManager.getChunk(templatePosition);
            }
        }
    }

    player.sendMessage(`Welcome home.`);
};


export class House {

    public rooms: (Room | null)[][][];

    public constructor() {
        this.rooms = new Array(4);
        for(let level = 0; level < 4; level++) {
            this.rooms[level] = new Array(MAP_SIZE);
            for(let x = 0; x < MAP_SIZE; x++) {
                this.rooms[level][x] = new Array(MAP_SIZE).fill(null);

                if(level === 0) {
                    for(let y = 0; y < MAP_SIZE; y++) {
                        this.rooms[level][x][y] = new Room('empty_grass');
                    }
                }
            }
        }
    }

    public copyRooms(rooms: Room[][][]): void {
        for(let level = 0; level < 4; level++) {
            for(let x = 0; x < MAP_SIZE; x++) {
                for(let y = 0; y < MAP_SIZE; y++) {
                    const existingRoom = rooms[level][x][y] ?? null;

                    this.rooms[level][x][y] = existingRoom ? new Room(existingRoom.type, existingRoom.orientation) : null;
                }
            }
        }
    }

}


export class Room extends ConstructedChunk {

    public readonly type: RoomType;

    public constructor(type: RoomType, orientation: number = 0) {
        super(orientation);
        this.type = type;
    }

    public getTemplatePosition(): Position {
        return roomTemplates[this.type];
    }

}
