import { incomingPacket } from '../incoming-packet';
import { Player } from '../../player';
import { RsBuffer } from '@server/net/rs-buffer';
import { interfaceIds } from '@server/world/mob/player/game-interface';
import { logger } from '@runejs/logger/dist/logger';
import { itemOnItemAction } from '@server/world/mob/player/action/item-on-item-action';

export const itemOnItemPacket: incomingPacket = (player: Player, packetId: number, packetSize: number, packet: RsBuffer): void => {
    const usedWithItemId = packet.readUnsignedShortBE();
    const usedItemSlot = packet.readUnsignedShortLE();
    const usedItemId = packet.readUnsignedShortLE();
    const usedInterfaceId = packet.readNegativeOffsetShortLE();
    const usedWithItemSlot = packet.readNegativeOffsetShortBE();
    const usedWithInterfaceId = packet.readNegativeOffsetShortBE();

    if(usedInterfaceId === interfaceIds.inventory && usedWithInterfaceId === interfaceIds.inventory) {
        if(usedItemSlot < 0 || usedItemSlot > 27 || usedWithItemSlot < 0 || usedWithItemSlot > 27) {
            return;
        }

        const usedItem = player.inventory.items[usedItemSlot];
        const usedWithItem = player.inventory.items[usedWithItemSlot];
        if(!usedItem || !usedWithItem) {
            return;
        }

        if(usedItem.itemId !== usedItemId || usedWithItem.itemId !== usedWithItemId) {
            return;
        }

        itemOnItemAction(player, usedItem, usedItemSlot, usedInterfaceId, usedWithItem, usedWithItemSlot, usedWithInterfaceId);
    } else {
        logger.warn(`Unhandled item on item case using interfaces ${usedInterfaceId} => ${usedWithInterfaceId}`);
    }
};
