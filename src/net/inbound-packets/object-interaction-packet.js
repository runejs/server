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

    const { object: locationObject, cacheOriginal } = world.findObjectAtLocation(player, objectId, objectPosition);
    if(!locationObject) {
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
