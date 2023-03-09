import {
    objectInteractionActionHandler
} from '@engine/action/pipe/object-interaction.action';
import { openHouse, Room } from '@plugins/skills/construction/house';
import { MAP_SIZE, roomBuilderButtonMap } from '@plugins/skills/construction/con-constants';
import { buttonActionHandler } from '@engine/action/pipe/button.action';
import { getCurrentRoom } from '@plugins/skills/construction/util';
import { Player } from '@engine/world/actor/player/player';
import { Coords } from '@engine/world/position';
import { dialogue, execute, goto } from '@engine/world/actor/dialogue';
import { logger } from '@runejs/common';


const newRoomOriention = (player: Player): number => {
    const currentRoom = getCurrentRoom(player);

    if(!currentRoom) {
        return 0;
    }

    const playerLocalX = player.position.localX;
    const playerLocalY = player.position.localY;

    let deltaX = 0;
    let deltaY = 0;

    let orientation = 0;

    if(playerLocalX === 7) {
        // build east
        deltaX = 1;
        orientation = 1;
    } else if(playerLocalX === 0) {
        // build west
        deltaX = -1;
        orientation = 3;
    } else if(playerLocalY === 7) {
        // build north
        deltaY = 1;
        orientation = 0;
    } else if(playerLocalY === 0) {
        // build south
        deltaY = -1;
        orientation = 2;
    }

    return orientation;
};


export const canBuildNewRoom = (player: Player): Coords | null => {
    const currentRoom = getCurrentRoom(player);

    if(!currentRoom) {
        return null;
    }

    const playerLocalX = player.position.localX;
    const playerLocalY = player.position.localY;

    let buildX = currentRoom.x;
    let buildY = currentRoom.y;

    if(playerLocalX === 7) {
        // build east
        if(currentRoom.x < MAP_SIZE - 3) {
            buildX = currentRoom.x + 1;
        }
    } else if(playerLocalX === 0) {
        // build west
        if(currentRoom.x > 2) {
            buildX = currentRoom.x - 1;
        }
    } else if(playerLocalY === 7) {
        // build north
        if(currentRoom.y < MAP_SIZE - 3) {
            buildY = currentRoom.y + 1;
        }
    } else if(playerLocalY === 0) {
        // build south
        if(currentRoom.y > 2) {
            buildY = currentRoom.y - 1;
        }
    }

    if(buildX === currentRoom.x && buildY === currentRoom.y) {
        player.sendMessage(`You can not build there.`);
        return null;
    }

    const playerCustomMap = player.metadata.customMap;
    if(!playerCustomMap) {
        logger.error(`Player ${player.username} does not have a custom map.`);
        return null;
    }
    const rooms = playerCustomMap.chunks as Room[][][];
    const existingRoom = rooms[player.position.level][buildX][buildY];

    if(existingRoom && existingRoom.type !== 'empty_grass' && existingRoom.type !== 'empty') {
        player.sendMessage(`${existingRoom.type} already exists there`); // @TODO
        return null;
    }

    return {
        x: buildX,
        y: buildY,
        level: player.position.level
    };
};


export const roomBuilderWidgetHandler: buttonActionHandler = async ({ player, buttonId }) => {
    const newRoomCoords = canBuildNewRoom(player);
    if(!newRoomCoords) {
        return;
    }

    const chosenRoomType = roomBuilderButtonMap[buttonId];
    if(!chosenRoomType) {
        return;
    }

    const playerCustomMap = player.metadata.customMap;
    if(!playerCustomMap) {
        logger.error(`Player ${player.username} does not have a custom map.`);
        return;
    }

    const createdRoom = new Room(chosenRoomType, newRoomOriention(player));
    playerCustomMap.chunks[newRoomCoords.level][newRoomCoords.x][newRoomCoords.y] = createdRoom;

    player.interfaceState.closeAllSlots();

    openHouse(player);

    await dialogue([ player ], [
        (options, tag_Home) => [
            'Rotate Counter-Clockwise', [
                execute(() => {
                    createdRoom.orientation = createdRoom.orientation > 0 ? createdRoom.orientation - 1 : 3;
                    openHouse(player);
                }),
                goto('tag_Home')
            ],
            'Rotate Clockwise', [
                execute(() => {
                    createdRoom.orientation = createdRoom.orientation < 3 ? createdRoom.orientation + 1 : 0;
                    openHouse(player);
                }),
                goto('tag_Home')
            ],
            'Accept', [
                execute(() => {})
            ]
        ]
    ]);
};


export const doorHotspotHandler: objectInteractionActionHandler = ({ player }) => {
    if(!canBuildNewRoom(player)) {
        return;
    }

    player.interfaceState.openWidget(402, { slot: 'screen' });
};
