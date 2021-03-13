import { Position } from '@engine/world/position';
import { directionData, WNES } from '@engine/world/direction';
import { logger } from '@runejs/core';
import { world } from '@engine/game-server';
import { ModifiedLocationObject } from '@engine/world/map/location-object';
import { objectInteractionActionHandler } from '@engine/world/action/object-interaction.action';
import { soundIds } from '@engine/world/config/sound-ids';

const gates = [
    {
        main: 1551,
        mainOpen: 1552,
        hinge: 'LEFT',
        secondary: 1553,
        secondaryOpen: 1556
    },
    {
        main: 12986,
        mainOpen: 12988,
        hinge: 'LEFT',
        secondary: 12987,
        secondaryOpen: 12989
    }
];

// @TODO clean up this disgusting code
const action: objectInteractionActionHandler = (details) => {
    const { player, cacheOriginal } = details;
    let { object: gate, position } = details;

    if((gate as ModifiedLocationObject).metadata) {
        const metadata = (gate as ModifiedLocationObject).metadata;

        player.instance.toggleGameObjects(metadata.originalMain, metadata.main, true);
        player.instance.toggleGameObjects(metadata.originalSecond, metadata.second, true);
        player.playSound(soundIds.closeGate, 7);
    } else {
        let details = gates.find(g => g.main === gate.objectId);
        let clickedSecondary = false;
        let secondGate;
        let hinge;
        let direction = WNES[gate.orientation];
        let hingeChunk, gateSecondPosition;

        if(!details) {
            details = gates.find(g => g.secondary === gate.objectId);
            secondGate = gate;
            gateSecondPosition = position;
            clickedSecondary = true;

            hinge = details.hinge;
            let deltaX = 0;
            let deltaY = 0;

            if(hinge === 'LEFT') {
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
            } else if(hinge === 'RIGHT') {
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

            const pos = new Position(gate.x + deltaX, gate.y + deltaY, gate.level);
            hingeChunk = world.chunkManager.getChunkForWorldPosition(pos);
            gate = hingeChunk.getCacheObject(details.main, pos);
            direction = WNES[gate.orientation];
            position = pos;
        } else {
            hinge = details.hinge;
        }

        let deltaX = 0;
        let deltaY = 0;
        let newX = 0;
        let newY = 0;

        if(hinge === 'LEFT') {
            switch(direction) {
                case 'WEST':
                    deltaY++;
                    newX--;
                    break;
                case 'EAST':
                    deltaY--;
                    newX++;
                    break;
                case 'NORTH':
                    deltaX++;
                    newY++;
                    break;
                case 'SOUTH':
                    deltaX--;
                    newY--;
                    break;
            }
        } else if(hinge === 'RIGHT') {
            switch(direction) {
                case 'WEST':
                    deltaY--;
                    newX++;
                    break;
                case 'EAST':
                    deltaY++;
                    newX--;
                    break;
                case 'NORTH':
                    deltaX--;
                    newY--;
                    break;
                case 'SOUTH':
                    deltaX++;
                    newY++;
                    break;
            }
        }

        const leftHingeDirections: { [key: string]: string } = {
            'NORTH': 'WEST',
            'SOUTH': 'EAST',
            'WEST': 'SOUTH',
            'EAST': 'NORTH'
        };
        const rightHingeDirections: { [key: string]: string } = {
            'NORTH': 'EAST',
            'SOUTH': 'WEST',
            'WEST': 'NORTH',
            'EAST': 'SOUTH'
        };

        if(deltaX === 0 && deltaY === 0) {
            logger.error('Improperly handled gate at ' + gate.x + ',' + gate.y + ',' + gate.level);
            return;
        }

        const newDirection = hinge === 'LEFT' ? leftHingeDirections[direction] : rightHingeDirections[direction];

        if(!clickedSecondary) {
            gateSecondPosition = new Position(gate.x + deltaX, gate.y + deltaY, gate.level);
        }

        const gateSecondChunk = world.chunkManager.getChunkForWorldPosition(gateSecondPosition);

        if(!clickedSecondary) {
            secondGate = gateSecondChunk.getCacheObject(details.secondary, gateSecondPosition);
        }

        const newPosition = position.step(1, direction);
        const newSecondPosition = new Position(newPosition.x + newX, newPosition.y + newY, gate.level);

        const newHinge = {
            objectId: details.mainOpen,
            x: newPosition.x,
            y: newPosition.y,
            level: newPosition.level,
            type: gate.type,
            orientation: directionData[newDirection].rotation
        } as ModifiedLocationObject;
        const newSecond = {
            objectId: details.secondaryOpen,
            x: newSecondPosition.x,
            y: newSecondPosition.y,
            level: newSecondPosition.level,
            type: gate.type,
            orientation: directionData[newDirection].rotation
        } as ModifiedLocationObject;

        const metadata = {
            second: JSON.parse(JSON.stringify(newSecond)),
            originalSecond: secondGate,
            main: JSON.parse(JSON.stringify(newHinge)),
            originalMain: gate
        };

        newHinge.metadata = metadata;
        newSecond.metadata = metadata;

        player.instance.toggleGameObjects(newHinge, gate, !cacheOriginal);
        player.instance.toggleGameObjects(newSecond, secondGate, !cacheOriginal);
        player.playSound(soundIds.openGate, 7);
    }
};

export default {
    pluginId: 'rs:gates',
    hooks: [
        {
            type: 'object_interaction', objectIds: [ 1551, 1552, 1553, 1556, 12986, 12987, 12988, 12989 ],
            options: [ 'open', 'close' ], walkTo: true, handler: action
        }
    ]
};
