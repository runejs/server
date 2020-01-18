import { Player } from '@server/world/mob/player/player';
import { LandscapeObject } from '@runejs/cache-parser';
import { Position } from '@server/world/position';
import { Direction, directionData, WNES } from '@server/world/direction';
import { world } from '@server/game-server';
import { ModifiedLandscapeObject } from '@server/world/map/landscape-object';
import { Chunk } from '@server/world/map/chunk';

const leftHinge = [1516, 1536, 1533];
const rightHinge = [1519, 1530, 4465, 4467, 3014, 3017, 3018, 3019, 1531];
const preOpened = [1531, 1534];

export const doorAction = (player: Player, door: LandscapeObject, position: Position, cacheOriginal: boolean): void => {
    let newDoor: ModifiedLandscapeObject;
    let newPosition: Position;
    const originalDoorChunk: Chunk = world.chunkManager.getChunkForWorldPosition(position);

    if(cacheOriginal) {
        let leftHingeDirections: { [key: string]: string } = {
            'NORTH': 'WEST',
            'SOUTH': 'EAST',
            'WEST': 'SOUTH',
            'EAST': 'NORTH'
        };
        let rightHingeDirections: { [key: string]: string } = {
            'NORTH': 'EAST',
            'SOUTH': 'WEST',
            'WEST': 'NORTH',
            'EAST': 'SOUTH'
        };
        let alreadyOpen = false;

        if(preOpened.indexOf(door.objectId) !== -1) {
            alreadyOpen = true;
        }

        let hinge: 'RIGHT' | 'LEFT';
        if(leftHinge.indexOf(door.objectId) !== -1) {
            hinge = alreadyOpen ? 'RIGHT' : 'LEFT';
        } else {
            hinge = alreadyOpen ? 'LEFT' : 'RIGHT';
        }

        const originalDirection = WNES[door.rotation];
        const newDirection = hinge === 'LEFT' ? leftHingeDirections[originalDirection] : rightHingeDirections[originalDirection];
        newPosition = position.step(alreadyOpen ? -1 : 1, alreadyOpen ? newDirection as Direction : originalDirection);

        newDoor = {
            objectId: door.objectId,
            x: newPosition.x,
            y: newPosition.y,
            level: position.level,
            type: door.type,
            rotation: directionData[newDirection].rotation,
            metadata: {
                'originalPosition': position,
                'originalObject': door
            }
        };

        player.packetSender.chatboxMessage(`Door | Original direction ${originalDirection}, new direction ${newDirection}`);
    } else {
        newPosition = (door as ModifiedLandscapeObject).metadata['originalPosition'];
        newDoor = (door as ModifiedLandscapeObject).metadata['originalObject'];
    }

    const newDoorChunk = world.chunkManager.getChunkForWorldPosition(newPosition);

    world.chunkManager.toggleObjects(newDoor, door, newPosition, position, newDoorChunk, originalDoorChunk, !cacheOriginal);
};
