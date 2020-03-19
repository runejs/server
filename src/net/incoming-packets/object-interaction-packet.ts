import { incomingPacket } from '../incoming-packet';
import { Player } from '../../world/actor/player/player';
import { RsBuffer } from '@server/net/rs-buffer';
import { Position } from '@server/world/position';
import { cache, world } from '@server/game-server';
import { objectAction } from '@server/world/actor/player/action/object-action';
import { logger } from '@runejs/logger/dist/logger';

interface ObjectInteraction {
    objectId: number;
    x: number;
    y: number;
}

const option1 = (packet: RsBuffer): ObjectInteraction => {
    const objectId = packet.readNegativeOffsetShortBE();
    const y = packet.readNegativeOffsetShortBE();
    const x = packet.readNegativeOffsetShortLE();
    return { objectId, x, y };
};

const option2 = (packet: RsBuffer): ObjectInteraction => {
    const x = packet.readNegativeOffsetShortLE();
    const y = packet.readNegativeOffsetShortLE();
    const objectId = packet.readNegativeOffsetShortLE();
    return { objectId, x, y };
};

const option3 = (packet: RsBuffer): ObjectInteraction => {
    const y = packet.readNegativeOffsetShortBE();
    const objectId = packet.readUnsignedShortBE();
    const x = packet.readNegativeOffsetShortBE();
    return { objectId, x, y };
};

const option4 = (packet: RsBuffer): ObjectInteraction => {
    const x = packet.readUnsignedShortBE();
    const y = packet.readUnsignedShortLE();
    const objectId = packet.readUnsignedShortBE();
    return { objectId, x, y };
};

const option5 = (packet: RsBuffer): ObjectInteraction => {
    const objectId = packet.readUnsignedShortLE();
    const y = packet.readUnsignedShortLE();
    const x = packet.readUnsignedShortBE();
    return { objectId, x, y };
};

export const objectInteractionPacket: incomingPacket = (player: Player, packetId: number, packetSize: number, packet: RsBuffer): void => {
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
    let cacheOriginal: boolean = true;

    let locationObject = objectChunk.getCacheObject(objectId, objectPosition);
    if(!locationObject) {
        locationObject = objectChunk.getAddedObject(objectId, objectPosition);
        cacheOriginal = false;

        if(!locationObject) {
            return;
        }
    }

    if(objectChunk.getRemovedObject(objectId, objectPosition)) {
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

    objectAction(player, locationObject, locationObjectDefinition, objectPosition, optionName.toLowerCase(), cacheOriginal);
};
