import { Position } from '@engine/world/position';
import { Player } from '@engine/world/actor/player/player';
import { PlayerCommandAction } from '@engine/world/action/player-command.action';
import { PlayerInitAction } from '@engine/world/action/player-init.action';
import { ConstructedRegion, getTemplateRotatedX, getTemplateRotatedY } from '@engine/world/map/region';

import { instance1, instance1Max, instance1PohSpawn, instance2, instance2Max, MAP_SIZE } from './con-constants';
import { House, Room } from './con-house';
import { ObjectInteractionAction } from '@engine/world/action/object-interaction.action';
import { world } from '@engine/game-server';


const openHouse = (player: Player): void => {
    let pohPosition: Position = instance1;
    let playerSpawn: Position = instance1PohSpawn;

    if(player.position.within(instance1, instance1Max, false)) {
        playerSpawn = player.position.copy().setY(player.position.y + 64);
        pohPosition = instance2;
    } else if(player.position.within(instance2, instance2Max, false)) {
        playerSpawn = player.position.copy().setY(player.position.y - 64);
    }

    player.teleport(playerSpawn);

    if(!player.metadata.customMap) {
        const house = new House();

        const gardenPortal = new Room('garden_1');
        const parlor0 = new Room('parlor');
        const parlor90 = new Room('parlor', 1);
        const parlor180 = new Room('parlor', 2);
        const parlor270 = new Room('parlor', 3);
        const emptySpace = new Room('empty_grass');

        for(let x = 0; x < MAP_SIZE; x++) {
            for(let y = 0; y < MAP_SIZE; y++) {
                if(x === 6 && y === 6) {
                    house.rooms[0][x][y] = gardenPortal;
                } else if(x === 5 && y === 6) {
                    house.rooms[0][x][y] = parlor0;
                } else if(x === 6 && y === 7) {
                    house.rooms[0][x][y] = parlor90;
                } else if(x === 7 && y === 6) {
                    house.rooms[0][x][y] = parlor180;
                } else if(x === 6 && y === 5) {
                    house.rooms[0][x][y] = parlor270;
                } else {
                    house.rooms[0][x][y] = emptySpace;
                }
            }
        }

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
                const templateChunk = world.chunkManager.getChunk(templatePosition);
                // ??? think this is just loading the template chunks into memory
            }
        }
    }

    player.sendMessage(`Welcome home.`);
};


const doorHotspot = (objectInteraction: ObjectInteractionAction): void => {
    const { player, object, position } = objectInteraction;

    const customMap: ConstructedRegion = player.metadata?.customMap;

    if(!customMap) {
        return;
    }

    const mapWorldX = customMap.renderPosition.x;
    const mapWorldY = customMap.renderPosition.y;

    const topCornerMapChunk = world.chunkManager.getChunkForWorldPosition(new Position(mapWorldX, mapWorldY, player.position.level));
    const playerChunk = world.chunkManager.getChunkForWorldPosition(player.position);

    const currentRoomX = playerChunk.position.x - (topCornerMapChunk.position.x - 2);
    const currentRoomY = playerChunk.position.y - (topCornerMapChunk.position.y - 2);

    const rooms = customMap.chunks as Room[][][];
    const currentRoom = rooms[player.position.level][currentRoomX][currentRoomY];

    const playerLocalRoomX = player.position.localX;
    const playerLocalRoomY = player.position.localY;

    // Standard home outer door ids: closed[13100, 13101], open[13102, 13103]

    /*player.personalInstance.spawnGameObject({
        x: position.x,
        y: position.y,
        level: position.level,
        orientation: object.orientation,
        objectId: 13100,
        type: object.type
    });*/

    let buildX: number = currentRoomX;
    let buildY: number = currentRoomY;

    if(playerLocalRoomX === 7) {
        // build east
        if(currentRoomX < MAP_SIZE - 3) {
            buildX = currentRoomX + 1;
        }
    } else if(playerLocalRoomX === 0) {
        // build west
        if(currentRoomX > 2) {
            buildX = currentRoomX - 1;
        }
    } else if(playerLocalRoomY === 7) {
        // build north
        if(currentRoomY < MAP_SIZE - 3) {
            buildY = currentRoomY + 1;
        }
    } else if(playerLocalRoomY === 0) {
        // build south
        if(currentRoomY > 2) {
            buildY = currentRoomY - 1;
        }
    }

    if(buildX === currentRoomX && buildY === currentRoomY) {
        player.sendMessage(`You can not build there.`);
        return;
    }

    const existingRoom = rooms[player.position.level][buildX][buildY];

    if(existingRoom && existingRoom.type !== 'empty_grass' && existingRoom.type !== 'empty') {
        player.sendMessage(`${existingRoom.type} already exists there`); // @TODO
        return;
    }

    customMap.chunks[player.position.level][buildX][buildY] = new Room('parlor');

    openHouse(player);

    // player.sendMessage(`player ${playerLocalRoomX},${playerLocalRoomY}`);
    // player.sendMessage(`within house ${currentRoomX},${currentRoomY}`);
};


export default {
    pluginId: 'rs:construction',
    hooks: [
        {
            type: 'object_interaction',
            objectIds: [ 15313, 15314 ],
            options: 'build',
            walkTo: true,
            handler: doorHotspot
        },
        {
            type: 'player_command',
            commands: [ 'con', 'poh', 'house' ],
            handler: ({ player }: PlayerCommandAction): void => openHouse(player)
        },
        {
            type: 'player_init',
            handler: ({ player }: PlayerInitAction): void => {
                if(player.position.within(instance1, instance1Max, false) ||
                    player.position.within(instance2, instance2Max, false)) {
                    openHouse(player);
                }
            }
        }
    ]
};
