import { incomingPacket } from '../incoming-packet';
import { Player } from '../../world/actor/player/player';
import { RsBuffer } from '@server/net/rs-buffer';
import { widgets } from '@server/world/config/widget';
import { logger } from '@runejs/logger/dist/logger';
import { itemOnItemAction } from '@server/world/actor/player/action/item-on-item-action';

export const itemOnItemPacket: incomingPacket = (player: Player, packetId: number, packetSize: number, packet: RsBuffer): void => {
    const usedWithItemId = packet.readNegativeOffsetShortLE();
    const usedWithSlot = packet.readNegativeOffsetShortLE();
    const usedWithContainerId = packet.readUnsignedShortLE();
    const usedWithWidgetId = packet.readUnsignedShortLE();
    const usedContainerId = packet.readUnsignedShortLE();
    const usedWidgetId = packet.readUnsignedShortLE();
    const usedItemId = packet.readUnsignedShortLE();
    const usedSlot = packet.readNegativeOffsetShortBE();

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

        itemOnItemAction(player, usedItem, usedSlot, usedWidgetId, usedWithItem, usedWithSlot, usedWithWidgetId);
    } else {
        logger.warn(`Unhandled item on item case using widgets ${usedWidgetId}:${usedContainerId} => ${usedWithWidgetId}:${usedWithContainerId}`);
    }
};
