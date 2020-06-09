import { incomingPacket } from '../incoming-packet';
import { Player } from '../../world/actor/player/player';
import { widgets } from '@server/world/config/widget';
import { logger } from '@runejs/logger';
import { itemOnItemAction } from '@server/world/actor/player/action/item-on-item-action';
import { ByteBuffer } from '@runejs/byte-buffer';

export const itemOnItemPacket: incomingPacket = (player: Player, packetId: number, packetSize: number, packet: ByteBuffer): void => {
    const usedWithItemId = packet.get('SHORT', 'UNSIGNED', 'LITTLE_ENDIAN');
    const usedWithSlot = packet.get('SHORT', 'UNSIGNED', 'LITTLE_ENDIAN');
    const usedWithContainerId = packet.get('SHORT', 'SIGNED', 'LITTLE_ENDIAN');
    const usedWithWidgetId = packet.get('SHORT', 'SIGNED', 'LITTLE_ENDIAN');
    const usedContainerId = packet.get('SHORT', 'SIGNED', 'LITTLE_ENDIAN');
    const usedWidgetId = packet.get('SHORT', 'SIGNED', 'LITTLE_ENDIAN');
    const usedItemId = packet.get('SHORT', 'UNSIGNED', 'LITTLE_ENDIAN');
    const usedSlot = packet.get('SHORT', 'UNSIGNED');

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
