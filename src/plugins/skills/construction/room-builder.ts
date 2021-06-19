import {
    objectInteractionActionHandler
} from '@engine/world/action/object-interaction.action';
import { openHouse, Room } from '@plugins/skills/construction/house';
import { MAP_SIZE, roomBuilderButtonMap } from '@plugins/skills/construction/con-constants';
import { buttonActionHandler } from '@engine/world/action/button.action';
import { getCurrentRoom } from '@plugins/skills/construction/util';
import { Player } from '@engine/world/actor/player/player';
import { Coords } from '@engine/world/position';


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

    const rooms = player.metadata.customMap.chunks as Room[][][];
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


export const roomBuilderWidgetHandler: buttonActionHandler = ({ player, buttonId }) => {
    const newRoomCoords = canBuildNewRoom(player);
    if(!newRoomCoords) {
        return;
    }

    const chosenRoomType = roomBuilderButtonMap[buttonId];
    if(!chosenRoomType) {
        return;
    }

    player.metadata.customMap.chunks[newRoomCoords.level][newRoomCoords.x][newRoomCoords.y] = new Room(chosenRoomType);

    player.interfaceState.closeAllSlots();

    openHouse(player);
};


export const doorHotspotHandler: objectInteractionActionHandler = ({ player }) => {
    if(!canBuildNewRoom(player)) {
        return;
    }

    player.interfaceState.openWidget(402, { slot: 'screen' });
};
