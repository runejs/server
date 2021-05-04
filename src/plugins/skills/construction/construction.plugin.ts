import { Position } from '@engine/world/position';
import { Player } from '@engine/world/actor/player/player';
import { PlayerCommandAction } from '@engine/world/action/player-command.action';
import { PlayerInitAction } from '@engine/world/action/player-init.action';
import { ConstructedMap } from '@engine/world/map/region';

import { instance1, instance1Max, instance1PohSpawn, instance2, instance2Max, MAP_SIZE } from './con-constants';
import { House, Room } from './con-house';


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
        position: pohPosition,
        rooms: house.rooms
    } as ConstructedMap;

    player.sendMessage(`Welcome home.`);
};


const playerInitHomeCheck = (player: Player): void => {
    if(player.position.within(instance1, instance1Max, false) ||
        player.position.within(instance2, instance2Max, false)) {
        openHouse(player);
    }
};


export default {
    pluginId: 'rs:construction',
    hooks: [
        {
            type: 'player_command',
            commands: [ 'con', 'poh', 'house' ],
            handler: ({ player }: PlayerCommandAction): void => openHouse(player)
        },
        {
            type: 'player_init',
            handler: ({ player }: PlayerInitAction): void => playerInitHomeCheck(player)
        }
    ]
};
