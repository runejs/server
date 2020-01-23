import { incomingPacket } from '../incoming-packet';
import { Player } from '../../player';
import { RsBuffer } from '@server/net/rs-buffer';
import { Position } from '@server/world/position';
import { world } from '@server/game-server';
import { doorAction } from '@server/world/mob/player/action/doors/door-action';
import { walkToAction } from '@server/world/mob/player/action/action';
import { doubleDoorAction } from '@server/world/mob/player/action/doors/double-door-action';

const doors = [1530, 4465, 4467, 3014, 3017, 3018, 3019, 1536, 1533, 1531, 1534, 12348];
const doubleDoors = [12349, 12350, 1519, 1516];

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

    if(doors.indexOf(objectId) !== -1) {
        walkToAction(player, objectPosition).then(() => doorAction(player, chunkObject, objectPosition, cacheOriginal));
    } else if(doubleDoors.indexOf(objectId) !== -1) {
        walkToAction(player, objectPosition).then(() => doubleDoorAction(player, chunkObject, objectPosition, cacheOriginal));
    } else {
        player.packetSender.chatboxMessage(`Unhandled object interaction: ${objectId} @ ${x},${y}`);
    }
};
