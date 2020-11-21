import { Position } from '../../world/position';
import { cache, world } from '../../game-server';
import { logger } from '@runejs/core';
import { actionHandler } from '../../world/action';

const option1 = packet => {
    const { buffer } = packet;
    const objectId = buffer.get('SHORT', 'UNSIGNED');
    const y = buffer.get('SHORT', 'UNSIGNED');
    const x = buffer.get('SHORT', 'UNSIGNED', 'LITTLE_ENDIAN');
    return { objectId, x, y };
};

const option2 = packet => {
    const { buffer } = packet;
    const x = buffer.get('SHORT', 'UNSIGNED', 'LITTLE_ENDIAN');
    const y = buffer.get('SHORT', 'UNSIGNED', 'LITTLE_ENDIAN');
    const objectId = buffer.get('SHORT', 'UNSIGNED', 'LITTLE_ENDIAN');
    return { objectId, x, y };
};

const option3 = packet => {
    const { buffer } = packet;
    const y = buffer.get('SHORT', 'UNSIGNED');
    const objectId = buffer.get('SHORT', 'UNSIGNED');
    const x = buffer.get('SHORT', 'UNSIGNED');
    return { objectId, x, y };
};

const objectInteractionPacket = (player, packet) => {
    const { packetId } = packet;

    const options = {
        30: { packetDef: option1, index: 0 },
        164: { packetDef: option2, index: 1 },
        183: { packetDef: option3, index: 2 },
        /*136: { packetDef: option4, index: 3 },
        55:  { packetDef: option5, index: 4 },*/
    };

    const { objectId, x, y } = options[packetId].packetDef(packet);
    const level = player.position.level;

    const objectPosition = new Position(x, y, level);
    const objectChunk = world.chunkManager.getChunkForWorldPosition(objectPosition);
    let cacheOriginal = true;

    const chunkModifications = player.instance
        .getInstancedChunk(objectChunk.position.x, objectChunk.position.y, objectChunk.position.level);
    const personalChunkModifications = player.personalInstance?.getInstancedChunk(objectChunk.position.x,
        objectChunk.position.y, objectChunk.position.level) || null;

    const tileModifications = chunkModifications?.mods?.get(objectPosition.key) || {};
    const personalTileModifications = personalChunkModifications?.mods?.get(objectPosition.key) || {};

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

    let locationObject = objectChunk.getCacheObject(objectId, objectPosition);
    if(!locationObject) {
        const tileObjects = [ ...tileModifications.spawnedObjects,
            ...personalTileModifications.spawnedObjects ];

        locationObject = tileObjects.find(spawnedObject =>
            spawnedObject.objectId === objectId && spawnedObject.x === x && spawnedObject.y === y) || null;

        cacheOriginal = false;

        if(!locationObject) {
            return;
        }
    }

    const hiddenTileObjects = [ ...tileModifications.hiddenObjects,
        ...personalTileModifications.hiddenObjects ];

    if(hiddenTileObjects.findIndex(spawnedObject =>
        spawnedObject.objectId === objectId && spawnedObject.x === x && spawnedObject.y === y) !== -1) {
        return;
    }

    const locationObjectDefinition = cache.locationObjectDefinitions.get(objectId);

    const actionIdx = options[packetId].index;
    let optionName = `action-${actionIdx + 1}`;
    if(locationObjectDefinition.options && locationObjectDefinition.options.length >= actionIdx) {
        if(!locationObjectDefinition.options[actionIdx] || locationObjectDefinition.options[actionIdx].toLowerCase() === 'hidden') {
            // Invalid action
            logger.error(`1: Invalid object ${objectId} option ${actionIdx + 1}, options: ${JSON.stringify(locationObjectDefinition.options)}`);
            return;
        }

        optionName = locationObjectDefinition.options[actionIdx];
    } else {
        // Invalid action
        logger.error(`2: Invalid object ${objectId} option ${actionIdx + 1}, options: ${JSON.stringify(locationObjectDefinition.options)}`);
        return;
    }

    actionHandler.call('object_action', player, locationObject, locationObjectDefinition, objectPosition, optionName.toLowerCase(), cacheOriginal);
};

export default [{
    opcode: 30,
    size: 6,
    handler: objectInteractionPacket
}, {
    opcode: 164,
    size: 6,
    handler: objectInteractionPacket
}, {
    opcode: 183,
    size: 6,
    handler: objectInteractionPacket
}];
