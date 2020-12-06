import { logger } from '@runejs/core';
import { Position } from '../../world/position';
import { cache, world } from '../../game-server';
import { actionHandler } from '../../world/action';
import { widgets } from '../../config';

const itemOnObjectPacket = (player, packet) => {
    const { buffer } = packet;
    const objectY = buffer.get('SHORT', 'UNSIGNED', 'LITTLE_ENDIAN');
    const itemId = buffer.get('SHORT', 'UNSIGNED');
    const objectId = buffer.get('SHORT', 'UNSIGNED', 'LITTLE_ENDIAN');
    const itemSlot = buffer.get('SHORT', 'UNSIGNED', 'LITTLE_ENDIAN');
    const itemWidgetId = buffer.get('SHORT', 'SIGNED', 'LITTLE_ENDIAN');
    const itemContainerId = buffer.get('SHORT', 'SIGNED', 'LITTLE_ENDIAN');
    const objectX = buffer.get('SHORT', 'UNSIGNED', 'LITTLE_ENDIAN');

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

    const { object: locationObject, cacheOriginal } = world.findObjectAtLocation(player, objectId, objectPosition);
    if(!locationObject) {
        return;
    }

    const locationObjectDefinition = cache.locationObjectDefinitions.get(objectId);

    actionHandler.call('item_on_object', player, locationObject, locationObjectDefinition, objectPosition, usedItem, itemWidgetId, itemContainerId, cacheOriginal);
};

export default {
    opcode: 24,
    size: 14,
    handler: itemOnObjectPacket
};
