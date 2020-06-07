import { Position } from '@server/world/position';
import { WNES } from '@server/world/direction';
import { logger } from '@runejs/logger';
import { world } from '@server/game-server';
import { action as doorAction } from '@server/plugins/objects/doors/door-plugin';
import { objectAction } from '@server/world/actor/player/action/object-action';
import { ActionType, RunePlugin } from '@server/plugins/plugin';

const doubleDoors = [
    {
        closed: [ 1516, 1519 ],
        open: [ 1517, 1520 ]
    }
];

const closingDelta = {
    'WEST': { x: 1, y: 0 },
    'EAST': { x: -1, y: 0 },
    'NORTH': { x: 0, y: -1 },
    'SOUTH': { x: 0, y: 1 }
};

const openingDelta = {
    'LEFT': {
        'WEST': { x: 0, y: 1 },
        'EAST': { x: 0, y: -1 },
        'NORTH': { x: 1, y: 0 },
        'SOUTH': { x: -1, y: 0 }
    },
    'RIGHT': {
        'WEST': { x: 0, y: -1 },
        'EAST': { x: 0, y: 1 },
        'NORTH': { x: -1, y: 0 },
        'SOUTH': { x: 1, y: 0 }
    }
};

const action: objectAction = (details) => {
    const { player, object: door, position, cacheOriginal } = details;
    let doorConfig = doubleDoors.find(d => d.closed.indexOf(door.objectId) !== -1);
    let doorIds: number[];
    let opening = true;
    if(!doorConfig) {
        doorConfig = doubleDoors.find(d => d.open.indexOf(door.objectId) !== -1);
        if(!doorConfig) {
            return;
        }

        opening = false;
        doorIds = doorConfig.open;
    } else {
        doorIds = doorConfig.closed;
    }

    const leftDoorId = doorIds[0];
    const rightDoorId = doorIds[1];
    const hinge = leftDoorId === door.objectId ? 'LEFT' : 'RIGHT';
    const direction = WNES[door.orientation];
    let deltaX = 0;
    let deltaY = 0;
    const otherDoorId = hinge === 'LEFT' ? rightDoorId : leftDoorId;

    if(!opening) {
        deltaX += closingDelta[direction].x;
        deltaY += closingDelta[direction].y;
    } else {
        deltaX += openingDelta[hinge][direction].x;
        deltaY += openingDelta[hinge][direction].y;
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

    doorAction({
        player,
        object: door,
        objectDefinition: null,
        position, cacheOriginal,
        option: opening ? 'open' : 'close'
    });
    doorAction({
        player,
        object: otherDoor,
        objectDefinition: null,
        position: otherDoorPosition,
        cacheOriginal,
        option: opening ? 'open' : 'close'
    });
};

export default new RunePlugin({ type: ActionType.OBJECT_ACTION, objectIds: [1519, 1516, 1517, 1520],
    options: [ 'open', 'close' ], walkTo: true, action });
