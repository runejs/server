import { logger } from '@runejs/core';
import { actionHandler } from '../../world/action';
import { widgets } from '../../config';

const itemOnItemPacket = (player, packet) => {
    const { buffer } = packet;
    const usedWithItemId = buffer.get('SHORT', 'UNSIGNED', 'LITTLE_ENDIAN');
    const usedWithSlot = buffer.get('SHORT', 'UNSIGNED', 'LITTLE_ENDIAN');
    const usedWithContainerId = buffer.get('SHORT', 'SIGNED', 'LITTLE_ENDIAN');
    const usedWithWidgetId = buffer.get('SHORT', 'SIGNED', 'LITTLE_ENDIAN');
    const usedContainerId = buffer.get('SHORT', 'SIGNED', 'LITTLE_ENDIAN');
    const usedWidgetId = buffer.get('SHORT', 'SIGNED', 'LITTLE_ENDIAN');
    const usedItemId = buffer.get('SHORT', 'UNSIGNED', 'LITTLE_ENDIAN');
    const usedSlot = buffer.get('SHORT', 'UNSIGNED');

    if(usedWidgetId === widgets.inventory.widgetId && usedContainerId === widgets.inventory.containerId &&
        usedWithWidgetId === widgets.inventory.widgetId && usedWithContainerId === widgets.inventory.containerId) {
        if(usedSlot < 0 || usedSlot > 27 || usedWithSlot < 0 || usedWithSlot > 27) {
            return;
        }

        const usedItem = player.inventory.items[usedSlot];
        const usedWithItem = player.inventory.items[usedWithSlot];
        if(!usedItem || !usedWithItem) {
            return;
        }

        if(usedItem.itemId !== usedItemId || usedWithItem.itemId !== usedWithItemId) {
            return;
        }

        actionHandler.call('item_on_item', player, usedItem, usedSlot, usedWidgetId, usedWithItem, usedWithSlot, usedWithWidgetId);
    } else {
        logger.warn(`Unhandled item on item case using widgets ${usedWidgetId}:${usedContainerId} => ${usedWithWidgetId}:${usedWithContainerId}`);
    }
};

export default {
    opcode: 40,
    size: 16,
    handler: itemOnItemPacket
};
