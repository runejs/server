import { Player } from '@server/world/mob/player/player';
import { LandscapeObject } from '@runejs/cache-parser';
import { Position } from '@server/world/position';
import { WNES } from '@server/world/direction';
import { logger } from '@runejs/logger/dist/logger';
import { world } from '@server/game-server';
import { doorAction } from '@server/world/mob/player/action/doors/door-action';

const leftHinge = [1516, 1517];
const rightHinge = [1519, 1520];
const open = [1517, 1520];

export const doubleDoorAction = (player: Player, door: LandscapeObject, position: Position, cacheOriginal: boolean): void => {
    const direction = WNES[door.rotation];
    let deltaX = 0;
    let deltaY = 0;
    let otherDoorId: number;
    const opening = open.indexOf(door.objectId) === -1;

    if(!opening) {
        switch(direction) {
            case 'WEST':
                deltaX++;
                break;
            case 'EAST':
                deltaX--;
                break;
            case 'NORTH':
                deltaY--;
                break;
            case 'SOUTH':
                deltaY++;
                break;
        }
    } else {
        if(leftHinge.indexOf(door.objectId) !== -1) {
            if(opening) {
                switch(direction) {
                    case 'WEST':
                        deltaY++;
                        break;
                    case 'EAST':
                        deltaY--;
                        break;
                    case 'NORTH':
                        deltaX++;
                        break;
                    case 'SOUTH':
                        deltaX--;
                        break;
                }
            }
        } else if(rightHinge.indexOf(door.objectId) !== -1) {
            if(opening) {
                switch(direction) {
                    case 'WEST':
                        deltaY--;
                        break;
                    case 'EAST':
                        deltaY++;
                        break;
                    case 'NORTH':
                        deltaX--;
                        break;
                    case 'SOUTH':
                        deltaX++;
                        break;
                }
            }
        }
    }

    if(leftHinge.indexOf(door.objectId) !== -1) {
        otherDoorId = rightHinge[leftHinge.indexOf(door.objectId)];
    } else if(rightHinge.indexOf(door.objectId) !== -1) {
        otherDoorId = leftHinge[rightHinge.indexOf(door.objectId)];
    }

    if(!otherDoorId || (deltaX === 0 && deltaY === 0)) {
        logger.error('Improperly handled double door at ' + door.x + ',' + door.y + ',' + door.level);
        return;
    }

    const otherDoorPosition = new Position(door.x + deltaX, door.y + deltaY, door.level);
    const otherDoorChunk = world.chunkManager.getChunkForWorldPosition(otherDoorPosition);

    let otherDoor = otherDoorChunk.getCacheObject(otherDoorId, otherDoorPosition);
    if(!otherDoor) {
        otherDoor = otherDoorChunk.getAddedObject(otherDoorId, otherDoorPosition);

        if(!otherDoor) {
            logger.error('Could not find other door ' + otherDoorId + ' at ' + (door.x + deltaX) + ',' + (door.y + deltaY) + ',' + door.level);
            return;
        }
    }

    if(otherDoorChunk.getRemovedObject(otherDoorId, otherDoorPosition)) {
        return;
    }

    doorAction(player, door, position, cacheOriginal);
    doorAction(player, otherDoor, otherDoorPosition, cacheOriginal);
};
