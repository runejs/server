import { incomingPacket } from '../incoming-packet';
import { Player } from '../../world/actor/player/player';
import { RsBuffer } from '@server/net/rs-buffer';
import { logger } from '@runejs/logger/dist/logger';
import { widgetIds } from '../../world/actor/player/widget';
import { equipItemAction } from '../../world/actor/player/action/equip-item-action';

export const itemEquipPacket: incomingPacket = (player: Player, packetId: number, packetSize: number, packet: RsBuffer): void => {
    const containerId = packet.readShortLE();
    const widgetId = packet.readShortLE();
    const slot = packet.readNegativeOffsetShortLE();
    const itemId = packet.readShortBE();

    if(widgetId !== widgetIds.inventory.widgetId || containerId !== widgetIds.inventory.containerId) {
        logger.warn(`${player.username} attempted to equip item from incorrect widget ${widgetId}:${containerId}.`);
        return;
    }

    if(slot < 0 || slot > 27) {
        logger.warn(`${player.username} attempted to equip item ${itemId} in invalid slot ${slot}.`);
        return;
    }

    const itemInSlot = player.inventory.items[slot];

    if(!itemInSlot) {
        logger.warn(`${player.username} attempted to equip item ${itemId} in slot ${slot}, but they do not have that item.`);
        return;
    }

    if(itemInSlot.itemId !== itemId) {
        logger.warn(`${player.username} attempted to equip item ${itemId} in slot ${slot}, but ${itemInSlot.itemId} was found there instead.`);
        return;
    }

    equipItemAction(player, itemId, slot);
};
