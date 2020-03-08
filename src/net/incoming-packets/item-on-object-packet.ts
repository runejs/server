import { incomingPacket } from '../incoming-packet';
import { Player } from '../../world/actor/player/player';
import { RsBuffer } from '@server/net/rs-buffer';
import { widgets } from '@server/world/config/widget';
import { logger } from '@runejs/logger/dist/logger';
import { itemOnItemAction } from '@server/world/actor/player/action/item-on-item-action';
import { Position } from '@server/world/position';
import { gameCache, world } from '@server/game-server';
import { objectAction } from '@server/world/actor/player/action/object-action';
import { itemOnObjectAction } from '@server/world/actor/player/action/item-on-object-action';

export const itemOnObjectPacket: incomingPacket = (player: Player, packetId: number, packetSize: number, packet: RsBuffer): void => {
    const objectY = packet.readNegativeOffsetShortLE();
    const itemId = packet.readNegativeOffsetShortBE();
    const objectId = packet.readUnsignedShortLE();
    const itemSlot = packet.readNegativeOffsetShortLE();
    const itemWidgetId = packet.readShortLE();
    const itemContainerId = packet.readShortLE();
    const objectX = packet.readNegativeOffsetShortLE();

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

    let landscapeObject = objectChunk.getCacheObject(objectId, objectPosition);
    if (!landscapeObject) {
        landscapeObject = objectChunk.getAddedObject(objectId, objectPosition);
        cacheOriginal = false;

        if (!landscapeObject) {
            return;
        }
    }

    if (objectChunk.getRemovedObject(objectId, objectPosition)) {
        return;
    }

    const landscapeObjectDefinition = gameCache.landscapeObjectDefinitions.get(objectId);


    itemOnObjectAction(player, landscapeObject, landscapeObjectDefinition, objectPosition, usedItem, itemWidgetId, itemContainerId, cacheOriginal);

};
