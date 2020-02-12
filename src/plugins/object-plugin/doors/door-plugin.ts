import { Player } from '@server/world/mob/player/player';
import { LandscapeObject } from '@runejs/cache-parser';
import { Position } from '@server/world/position';
import { directionData, WNES } from '@server/world/direction';
import { world } from '@server/game-server';
import { Chunk } from '@server/world/map/chunk';
import { objectAction, ObjectActionPlugin } from '@server/world/mob/player/action/object-action';

const objectIds = [1530, 4465, 4467, 3014, 3017, 3018, 3019, 1536, 1537, 1533, 1531, 1534, 12348];

// @TODO move to yaml config
const doors = [
    {
        closed: 1530,
        open: 1531,
        hinge: 'RIGHT'
    },
    {
        closed: 1533,
        open: 1534,
        hinge: 'RIGHT'
    },
    {
        closed: 1516,
        open: 1517,
        hinge: 'LEFT'
    },
    {
        closed: 1519,
        open: 1520,
        hinge: 'RIGHT'
    },
    {
        closed: 1536,
        open: 1537,
        hinge: 'LEFT'
    }
];

const leftHingeDir: { [key: string]: string } = {
    'NORTH': 'WEST',
    'SOUTH': 'EAST',
    'WEST': 'SOUTH',
    'EAST': 'NORTH'
};
const rightHingeDir: { [key: string]: string } = {
    'NORTH': 'EAST',
    'SOUTH': 'WEST',
    'WEST': 'NORTH',
    'EAST': 'SOUTH'
};

export const action: objectAction = (player: Player, door: LandscapeObject, position: Position, cacheOriginal: boolean): void => {
    let opening = true;

    let doorConfig = doors.find(d => d.closed === door.objectId);
    let hingeConfig;
    let replacementDoorId: number;
    if(!doorConfig) {
        doorConfig = doors.find(d => d.open === door.objectId);
        if(!doorConfig) {
            return;
        }

        opening = false;
        hingeConfig = doorConfig.hinge === 'LEFT' ? rightHingeDir : leftHingeDir;
        replacementDoorId = doorConfig.closed;
    } else {
        hingeConfig = doorConfig.hinge === 'LEFT' ? leftHingeDir : rightHingeDir;
        replacementDoorId = doorConfig.open;
    }

    const startDoorChunk: Chunk = world.chunkManager.getChunkForWorldPosition(position);
    const startDir = WNES[door.rotation];
    const endDir = hingeConfig[startDir];
    const endPosition = position.step(opening ? 1 : -1, opening? startDir : endDir);

    const replacementDoor = {
        objectId: replacementDoorId,
        x: endPosition.x,
        y: endPosition.y,
        level: position.level,
        type: door.type,
        rotation: directionData[endDir].rotation
    };

    const replacementDoorChunk = world.chunkManager.getChunkForWorldPosition(endPosition);

    world.chunkManager.toggleObjects(replacementDoor, door, endPosition, position, replacementDoorChunk, startDoorChunk, !cacheOriginal);
    player.packetSender.playSound(opening ? 318 : 326, 7);
};

export default { objectIds, action, walkTo: true } as ObjectActionPlugin;
