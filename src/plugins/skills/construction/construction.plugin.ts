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
    const firstParlor = new Room('parlor');
    const secondParlor = new Room('parlor', 1);
    const thirdParlor = new Room('parlor', 2);
    const fourthParlor = new Room('parlor', 3);
    const emptySpace = new Room('empty_grass');

    for(let x = 0; x < MAP_SIZE; x++) {
        for(let y = 0; y < MAP_SIZE; y++) {
            if(x === 6 && y === 6) {
                house.rooms[0][x][y] = gardenPortal;
            } else if(x === 5 && y === 6) {
                house.rooms[0][x][y] = firstParlor;
            } else if(x === 7 && y === 6) {
                house.rooms[0][x][y] = secondParlor;
            } else if(x === 6 && y === 5) {
                house.rooms[0][x][y] = thirdParlor;
            } else if(x === 6 && y === 7) {
                house.rooms[0][x][y] = fourthParlor;
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
                const templatePosition = room.templatePosition;
                const templateChunk = world.chunkManager.getChunk(templatePosition);

            }
        }
    }

    player.sendMessage(`Welcome home.`);
};


const doorHotspot = async (objectInteraction: ObjectInteractionAction): Promise<void> => {
    const { player, object, position } = objectInteraction;

    const customMap: ConstructedRegion = player?.metadata?.customMap;

    if(!customMap) {
        return;
    }

    const objectLocalX = position.x % 8;
    const objectLocalY = position.y % 8;

    // Standard home outer door ids: closed[13100, 13101], open[13102, 13103]

    player.personalInstance.spawnGameObject({
        x: position.x,
        y: position.y,
        level: position.level,
        orientation: object.orientation,
        objectId: 13103,
        type: object.type
    });

    player.sendMessage(`Template Local = ${getTemplateRotatedX(object.orientation, objectLocalX, objectLocalY)},${getTemplateRotatedY(object.orientation, objectLocalX, objectLocalY)}`);

    player.sendMessage(`Object Local ${objectLocalX},${objectLocalY} - rotation ${object.orientation}`);
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
