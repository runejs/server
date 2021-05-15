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
        renderPosition: pohPosition,
        chunks: house.rooms
    } as ConstructedRegion;

    for(let plane = 0; plane < 3; plane++) {
        for(let chunkX = 0; chunkX < 13; chunkX++) {
            for(let chunkY = 0; chunkY < 13; chunkY++) {
                const room = house.rooms[plane][chunkX][chunkY];
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

    const customMap: ConstructedRegion = player?.metadata?.customMap;

    if(!customMap) {
        return;
    }

    // Standard home outer door ids: closed[13100, 13101], open[13102, 13103]

    player.personalInstance.spawnGameObject({
        x: position.x,
        y: position.y,
        level: position.level,
        orientation: object.orientation,
        objectId: 13100,
        type: object.type
    });
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
