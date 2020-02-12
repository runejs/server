import { incomingPacket } from '../incoming-packet';
import { Player } from '../../player';
import { RsBuffer } from '@server/net/rs-buffer';
import { Position } from '@server/world/position';
import { world } from '@server/game-server';
import { objectAction } from '@server/world/mob/player/action/object-action';

export const objectInteractionPacket: incomingPacket = (player: Player, packetId: number, packetSize: number, packet: RsBuffer): void => {
    const x = packet.readNegativeOffsetShortBE();
    const y = packet.readUnsignedShortLE();
    const level = player.position.level;
    const objectId = packet.readUnsignedShortLE();
    const objectPosition = new Position(x, y, level);
    const objectChunk = world.chunkManager.getChunkForWorldPosition(objectPosition);
    let cacheOriginal: boolean = true;

    let chunkObject = objectChunk.getCacheObject(objectId, objectPosition);
    if(!chunkObject) {
        chunkObject = objectChunk.getAddedObject(objectId, objectPosition);
        cacheOriginal = false;

        if(!chunkObject) {
            return;
        }
    }

    if(objectChunk.getRemovedObject(objectId, objectPosition)) {
        return;
    }

    objectAction(player, chunkObject, objectPosition, cacheOriginal);
};
