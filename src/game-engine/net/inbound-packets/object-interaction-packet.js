import { Position } from '../../world/position';
import { filestore, world } from '../../game-server';
import { logger } from '@runejs/core';
import { getVarbitMorphIndex } from "../../util/varbits";
const option1 = packet => {
    const { buffer } = packet;
    const objectId = buffer.get('short', 'u');
    const y = buffer.get('short', 'u');
    const x = buffer.get('short', 'u', 'le');
    return { objectId, x, y };
};

const option2 = packet => {
    const { buffer } = packet;
    const x = buffer.get('short', 'u', 'le');
    const y = buffer.get('short', 'u', 'le');
    const objectId = buffer.get('short', 'u', 'le');
    return { objectId, x, y };
};

const option3 = packet => {
    const { buffer } = packet;
    const y = buffer.get('short', 'u');
    const objectId = buffer.get('short', 'u');
    const x = buffer.get('short', 'u');
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
    let { object: landscapeObject, cacheOriginal } = world.findObjectAtLocation(player, objectId, objectPosition);
    if(!landscapeObject) {
        return;
    }

    let objectConfig = filestore.configStore.objectStore.getObject(objectId);
    if (objectConfig.configChangeDest) {
        let morphIndex = -1;
        if(objectConfig.varbitId === -1) {
            if(objectConfig.configId !== -1) {
                const configValue = player.metadata['configs'] && player.metadata['configs'][objectConfig.configId] ? player.metadata['configs'][objectConfig.configId] : 0;
                morphIndex = configValue;

            }
        } else {
            morphIndex = getVarbitMorphIndex(objectConfig.varbitId, player.metadata['configs']);
        }
        if(morphIndex !== -1) {
            objectConfig = filestore.configStore.objectStore.getObject(objectConfig.configChangeDest[morphIndex]);
        }
    }

    const actionIdx = options[packetId].index;
    let optionName = `action-${actionIdx + 1}`;
    if(objectConfig.options && objectConfig.options.length >= actionIdx) {
        if(!objectConfig.options[actionIdx]) {
            // Invalid action
            logger.error(`1: Invalid object ${objectId} option ${actionIdx + 1}, options: ${JSON.stringify(objectConfig.options)}`);
            return;
        }

        optionName = objectConfig.options[actionIdx];
    } else {
        // Invalid action
        logger.error(`2: Invalid object ${objectId} option ${actionIdx + 1}, options: ${JSON.stringify(objectConfig.options)}`);
        return;
    }

    player.actionPipeline.call('object_interaction', player, landscapeObject, objectConfig, objectPosition, optionName.toLowerCase(), cacheOriginal);
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
