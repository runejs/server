import { logger } from '@runejs/core';
import { widgets } from '@engine/config';
import { Player } from '@engine/world/actor';
import { PacketData } from '@engine/net';

const itemOnItemPacket = (player: Player, packet: PacketData) => {
    const { buffer } = packet;
    const usedWithItemId = buffer.get('short', 'u', 'le');
    const usedWithSlot = buffer.get('short', 'u', 'le');
    const usedWithContainerId = buffer.get('short', 's', 'le');
    const usedWithWidgetId = buffer.get('short', 's', 'le');
    const usedContainerId = buffer.get('short', 's', 'le');
    const usedWidgetId = buffer.get('short', 's', 'le');
    const usedItemId = buffer.get('short', 'u', 'le');
    const usedSlot = buffer.get('short', 'u');

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

        player.actionPipeline.call('item_on_item', player, usedItem, usedSlot, usedWidgetId, usedWithItem, usedWithSlot, usedWithWidgetId);
    } else {
        logger.warn(`Unhandled item on item case using widgets ${usedWidgetId}:${usedContainerId} => ${usedWithWidgetId}:${usedWithContainerId}`);
    }
};

export default {
    opcode: 40,
    size: 16,
    handler: itemOnItemPacket
};
