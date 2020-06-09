import { incomingPacket } from '../incoming-packet';
import { Player } from '../../world/actor/player/player';
import { widgets } from '@server/world/config/widget';
import { logger } from '@runejs/logger';
import { Position } from '@server/world/position';
import { cache, world } from '@server/game-server';
import { itemOnObjectAction } from '@server/world/actor/player/action/item-on-object-action';
import { ByteBuffer } from '@runejs/byte-buffer';

export const itemOnObjectPacket: incomingPacket = (player: Player, packetId: number, packetSize: number, packet: ByteBuffer): void => {
    const objectY = packet.get('SHORT', 'UNSIGNED', 'LITTLE_ENDIAN');
    const itemId = packet.get('SHORT', 'UNSIGNED');
    const objectId = packet.get('SHORT', 'UNSIGNED', 'LITTLE_ENDIAN');
    const itemSlot = packet.get('SHORT', 'UNSIGNED', 'LITTLE_ENDIAN');
    const itemWidgetId = packet.get('SHORT', 'SIGNED', 'LITTLE_ENDIAN');
    const itemContainerId = packet.get('SHORT', 'SIGNED', 'LITTLE_ENDIAN');
    const objectX = packet.get('SHORT', 'UNSIGNED', 'LITTLE_ENDIAN');

    let usedItem;
    if (itemWidgetId === widgets.inventory.widgetId && itemContainerId === widgets.inventory.containerId) {
        if (itemSlot < 0 || itemSlot > 27) {
            return;
        }

        usedItem = player.inventory.items[itemSlot];
        if (!usedItem) {
            return;
        }

        if (usedItem.itemId !== itemId) {
            return;
        }
    } else {
        logger.warn(`Unhandled item on object case using widget ${itemWidgetId}:${itemContainerId}`);
    }
    const level = player.position.level;

    const objectPosition = new Position(objectX, objectY, level);
    const objectChunk = world.chunkManager.getChunkForWorldPosition(objectPosition);
    let cacheOriginal: boolean = true;

    let locationObject = objectChunk.getCacheObject(objectId, objectPosition);
    if (!locationObject) {
        locationObject = objectChunk.getAddedObject(objectId, objectPosition);
        cacheOriginal = false;

        if (!locationObject) {
            return;
        }
    }

    if (objectChunk.getRemovedObject(objectId, objectPosition)) {
        return;
    }

    const locationObjectDefinition = cache.locationObjectDefinitions.get(objectId);


    itemOnObjectAction(player, locationObject, locationObjectDefinition, objectPosition, usedItem, itemWidgetId, itemContainerId, cacheOriginal);

};
