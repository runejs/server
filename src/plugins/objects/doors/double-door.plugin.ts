import { Position } from '@engine/world/position';
import { WNES } from '@engine/world/direction';
import { logger } from '@runejs/core';
import { world } from '@engine/game-server';
import { action as doorAction } from '@plugins/objects/doors/door.plugin';
import { objectInteractionActionHandler } from '@engine/world/action/object-interaction.action';

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

const action: objectInteractionActionHandler = (details) => {
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

    const { object: otherDoor } = world.findObjectAtLocation(player, otherDoorId, otherDoorPosition);
    if(!otherDoor) {
        return;
    }

    doorAction({
        player,
        object: door,
        objectConfig: null,
        position, cacheOriginal,
        option: opening ? 'open' : 'close'
    });
    doorAction({
        player,
        object: otherDoor,
        objectConfig: null,
        position: otherDoorPosition,
        cacheOriginal,
        option: opening ? 'open' : 'close'
    });
};

export default {
    pluginId: 'rs:double_doors',
    hooks: [
        {
            type: 'object_interaction', objectIds: [ 1519, 1516, 1517, 1520 ],
            options: [ 'open', 'close' ], walkTo: true, handler: action
        }
    ]
};
