import { logger } from '@runejs/core';

import { filestore, world } from '@engine/game-server';
import { Position } from '@engine/world/position';
import { getVarbitMorphIndex } from '@engine/util/varbits';
import { PacketData } from '@engine/net/inbound-packets';
import { Player, Rights } from '@engine/world/actor/player/player';


interface ObjectInteractionData {
    objectId: number;
    x: number;
    y: number;
}

type objectInteractionPacket = (packet: PacketData) => ObjectInteractionData;


const option1: objectInteractionPacket = packet => {
    const { buffer } = packet;
    const objectId = buffer.get('short', 'u');
    const y = buffer.get('short', 'u');
    const x = buffer.get('short', 'u', 'le');
    return { objectId, x, y };
};

const option2: objectInteractionPacket = packet => {
    const { buffer } = packet;
    const x = buffer.get('short', 'u', 'le');
    const y = buffer.get('short', 'u', 'le');
    const objectId = buffer.get('short', 'u', 'le');
    return { objectId, x, y };
};

const option3: objectInteractionPacket = packet => {
    const { buffer } = packet;
    const y = buffer.get('short', 'u');
    const objectId = buffer.get('short', 'u');
    const x = buffer.get('short', 'u');
    return { objectId, x, y };
};

const option4: objectInteractionPacket = packet => {
    const { buffer } = packet;
    const x = buffer.get('short', 'u', 'le');
    const objectId = buffer.get('short', 'u', 'le');
    const y = buffer.get('short', 'u', 'le');
    return { objectId, x, y };
};

const option5: objectInteractionPacket = packet => {
    const { buffer } = packet;
    const objectId = buffer.get('short', 'u');
    const y = buffer.get('short', 'u', 'le');
    const x = buffer.get('short', 'u', 'le');
    return { objectId, x, y };
};


const objectInteractionPackets: { [key: number]: { packetDef: objectInteractionPacket, index: number } } = {
    30:  { packetDef: option1, index: 0 },
    164: { packetDef: option2, index: 1 },
    183: { packetDef: option3, index: 2 },
    229: { packetDef: option4, index: 3 },
    62:  { packetDef: option5, index: 4 },
};


const objectInteractionPacket = (player: Player, packet: PacketData) => {
    const { packetId } = packet;

    const { objectId, x, y } = objectInteractionPackets[packetId].packetDef(packet);
    const level = player.position.level;
    const objectPosition = new Position(x, y, level);
    const { object: landscapeObject, cacheOriginal } = world.findObjectAtLocation(player, objectId, objectPosition);
    if(!landscapeObject) {
        if(player.rights === Rights.ADMIN) {
            player.sendMessage(`Custom object ${objectId} @[${objectPosition.key}]`);
        }
        return;
    }

    let objectConfig = filestore.configStore.objectStore.getObject(objectId);
    if (objectConfig.configChangeDest) {
        let morphIndex = -1;
        if(objectConfig.varbitId === -1) {
            if(objectConfig.configId !== -1) {
                morphIndex = player.metadata['configs'] && player.metadata['configs'][objectConfig.configId] ?
                    player.metadata['configs'][objectConfig.configId] : 0;
            }
        } else {
            morphIndex = getVarbitMorphIndex(objectConfig.varbitId, player.metadata['configs']);
        }
        if(morphIndex !== -1) {
            objectConfig = filestore.configStore.objectStore.getObject(objectConfig.configChangeDest[morphIndex]);
        }
    }

    const actionIdx = objectInteractionPackets[packetId].index;
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


export default Object.keys(objectInteractionPackets).map(opcode => ({
    opcode: parseInt(opcode, 10),
    size: 6,
    handler: objectInteractionPacket
}));
