import { Player } from '@server/world/mob/player/player';
import { LandscapeObject } from '@runejs/cache-parser';
import { Position } from '@server/world/position';
import { directionData, WNES } from '@server/world/direction';
import { logger } from '@runejs/logger/dist/logger';
import { world } from '@server/game-server';
import { ModifiedLandscapeObject } from '@server/world/map/landscape-object';

const gates = [
    {
        main: 1551,
        hinge: 'LEFT',
        secondary: 1553
    }
];

export const gateAction = (player: Player, gate: LandscapeObject, position: Position, cacheOriginal: boolean): void => {
    if((gate as ModifiedLandscapeObject).metadata) {
        const metadata = (gate as ModifiedLandscapeObject).metadata;

        world.chunkManager.toggleObjects(metadata.originalMain, metadata.main, metadata.originalMainPosition, metadata.mainPosition, metadata.originalMainChunk, metadata.mainChunk, true);
        world.chunkManager.toggleObjects(metadata.originalSecond, metadata.second, metadata.originalSecondPosition, metadata.secondPosition, metadata.originalSecondChunk, metadata.secondChunk, true);
        player.packetSender.playSound(327, 7); // @TODO find correct gate closing sound
    } else {
        let details = gates.find(g => g.main === gate.objectId);
        let clickedSecondary = false;
        let secondGate;
        let hinge;
        let direction = WNES[gate.rotation];
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
            direction = WNES[gate.rotation];
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

        player.packetSender.chatboxMessage(hinge + ' ' + direction);

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

        if(deltaX === 0 && deltaY === 0) {
            logger.error('Improperly handled gate at ' + gate.x + ',' + gate.y + ',' + gate.level);
            return;
        }

        const newDirection = hinge === 'LEFT' ? leftHingeDirections[direction] : rightHingeDirections[direction];

        if(!clickedSecondary) {
            hingeChunk = world.chunkManager.getChunkForWorldPosition(position);
            gateSecondPosition = new Position(gate.x + deltaX, gate.y + deltaY, gate.level);
        }

        const gateSecondChunk = world.chunkManager.getChunkForWorldPosition(gateSecondPosition);

        if(!clickedSecondary) {
            secondGate = gateSecondChunk.getCacheObject(details.secondary, gateSecondPosition);
        }

        const newPosition = position.step(1, direction);
        const newHingeChunk = world.chunkManager.getChunkForWorldPosition(newPosition);
        const newSecondPosition = new Position(newPosition.x + newX, newPosition.y + newY, gate.level);
        const newSecondChunk = world.chunkManager.getChunkForWorldPosition(newSecondPosition);

        const newHinge = {
            objectId: gate.objectId + 1,
            x: newPosition.x,
            y: newPosition.y,
            level: newPosition.level,
            type: gate.type,
            rotation: directionData[newDirection].rotation
        } as ModifiedLandscapeObject;
        const newSecond = {
            objectId: details.secondary + 1,
            x: newSecondPosition.x,
            y: newSecondPosition.y,
            level: newSecondPosition.level,
            type: gate.type,
            rotation: directionData[newDirection].rotation
        } as ModifiedLandscapeObject;

        const metadata = {
            second: JSON.parse(JSON.stringify(newSecond)),
            originalSecond: secondGate,
            secondChunk: newSecondChunk,
            originalSecondChunk: gateSecondChunk,
            secondPosition: newSecondPosition,
            originalSecondPosition: gateSecondPosition,
            main: JSON.parse(JSON.stringify(newHinge)),
            originalMain: gate,
            mainChunk: newHingeChunk,
            originalMainChunk: hingeChunk,
            mainPosition: newPosition,
            originalMainPosition: position
        };

        newHinge.metadata = metadata;
        newSecond.metadata = metadata;

        world.chunkManager.toggleObjects(newHinge, gate, newPosition, position, newHingeChunk, hingeChunk, !cacheOriginal);
        world.chunkManager.toggleObjects(newSecond, secondGate, newSecondPosition, gateSecondPosition, newSecondChunk, gateSecondChunk, !cacheOriginal);
        player.packetSender.playSound(328, 7); // @TODO find correct gate opening sound
    }
};
