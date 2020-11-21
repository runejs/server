import { Position } from '@server/world/position';
import { WNES } from '@server/world/direction';
import { logger } from '@runejs/core';
import { world } from '@server/game-server';
import { action as doorAction } from '@server/plugins/objects/doors/door-plugin';
import { objectAction } from '@server/world/action/object-action';
import { RunePlugin } from '@server/plugins/plugin';
import { ActionType } from '@server/world/action';

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

    const chunkModifications = player.instance
        .getInstancedChunk(otherDoorChunk.position.x, otherDoorChunk.position.y, otherDoorChunk.position.level);
    const personalChunkModifications = player.personalInstance?.getInstancedChunk(otherDoorChunk.position.x,
        otherDoorChunk.position.y, otherDoorChunk.position.level) || null;

    const tileModifications = chunkModifications?.mods?.get(otherDoorPosition.key) || {};
    const personalTileModifications = personalChunkModifications?.mods?.get(otherDoorPosition.key) || {};

    if(!tileModifications.spawnedObjects) {
        tileModifications.spawnedObjects = [];
    }
    if(!personalTileModifications.spawnedObjects) {
        personalTileModifications.spawnedObjects = [];
    }
    if(!tileModifications.hiddenObjects) {
        tileModifications.hiddenObjects = [];
    }
    if(!personalTileModifications.hiddenObjects) {
        personalTileModifications.hiddenObjects = [];
    }

    let otherDoor = otherDoorChunk.getCacheObject(otherDoorId, otherDoorPosition);
    if(!otherDoor) {
        const tileObjects = [ ...tileModifications.spawnedObjects,
            ...personalTileModifications.spawnedObjects ];

        otherDoor = tileObjects.find(spawnedObject =>
            spawnedObject.objectId === otherDoorId && spawnedObject.x === otherDoorPosition.x && spawnedObject.y === otherDoorPosition.y) || null;

        if(!otherDoor) {
            logger.error('Could not find other door ' + otherDoorId + ' at ' + (door.x + deltaX) + ',' + (door.y + deltaY) + ',' + door.level);
            return;
        }
    }

    const hiddenTileObjects = [ ...tileModifications.hiddenObjects,
        ...personalTileModifications.hiddenObjects ];

    if(hiddenTileObjects.findIndex(spawnedObject =>
        spawnedObject.objectId === otherDoorId && spawnedObject.x === otherDoorPosition.x && spawnedObject.y === otherDoorPosition.y) !== -1) {
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

export default { type: 'object_action', objectIds: [1519, 1516, 1517, 1520],
    options: [ 'open', 'close' ], walkTo: true, action };
