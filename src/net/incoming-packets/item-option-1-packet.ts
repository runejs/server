import { incomingPacket } from '../incoming-packet';
import { RsBuffer } from '@server/net/rs-buffer';
import { Player } from '../../world/actor/player/player';
import { widgetIds } from '../../world/config/widget';
import { logger } from '@runejs/logger/dist/logger';
import { unequipItemAction } from '../../world/actor/player/action/unequip-item-action';
import { ItemContainer } from '@server/world/items/item-container';
import { buyItemValueAction } from '@server/world/actor/player/action/buy-item-value-action';
import { sellItemValueAction } from '@server/world/actor/player/action/sell-item-value-action';

export const itemOption1Packet: incomingPacket = (player: Player, packetId: number, packetSize: number, packet: RsBuffer): void => {
    const itemId = packet.readNegativeOffsetShortBE();
    const slot = packet.readShortLE();
    const widgetId = packet.readShortLE();
    const containerId = packet.readShortLE();

    // Handles the value option in shops.
    if(widgetId === widgetIds.shop.shopInventory) {
        buyItemValueAction(player, itemId, slot);
        return;
    }

    // Handles the value option in the shop inventory interface.
    if(widgetId === widgetIds.shop.playerInventory) {
        sellItemValueAction(player, itemId, slot);
        return;
    }

    let container: ItemContainer = null;

    if(widgetId === widgetIds.equipment.widgetId && containerId === widgetIds.equipment.containerId) {
        container = player.equipment;
    }

    if(!container) {
        logger.info(`Unhandled item option 1: ${widgetId}, ${slot}, ${itemId}`);
        return;
    }

    if(slot < 0 || slot > container.size - 1) {
        logger.warn(`${player.username} attempted item option 1 on ${itemId} in invalid slot ${slot}.`);
        return;
    }

    const itemInSlot = container.items[slot];

    if(!itemInSlot) {
        logger.warn(`${player.username} attempted item option 1 on ${itemId} in slot ${slot}, but they do not have that item.`);
        return;
    }

    if(itemInSlot.itemId !== itemId) {
        logger.warn(`${player.username} attempted item option 1 on ${itemId} in slot ${slot}, but ${itemInSlot.itemId} was found there instead.`);
        return;
    }

    if(widgetId === widgetIds.equipment.widgetId && containerId === widgetIds.equipment.containerId) {
        unequipItemAction(player, itemId, slot);
    }
};
