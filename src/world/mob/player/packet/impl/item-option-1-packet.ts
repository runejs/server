import { incomingPacket } from '../incoming-packet';
import { RsBuffer } from '@server/net/rs-buffer';
import { Player } from '../../player';
import { widgetIds } from '../../widget';
import { logger } from '@runejs/logger/dist/logger';
import { unequipItemAction } from '../../action/unequip-item-action';
import { ItemContainer } from '@server/world/items/item-container';
import { buyItemValueAction } from '@server/world/mob/player/action/buy-item-value-action';
import { sellItemValueAction } from '@server/world/mob/player/action/sell-item-value-action';

export const itemOption1Packet: incomingPacket = (player: Player, packetId: number, packetSize: number, packet: RsBuffer): void => {
    const itemId = packet.readNegativeOffsetShortBE();
    const widgetId = packet.readShortBE();
    const slot = packet.readShortBE();

    let container: ItemContainer = null;

    if(widgetId === widgetIds.equipment) {
        container = player.equipment;
    }

    // Handles the value option in shops.
    if(widgetId === widgetIds.shop.shopScreen) {
        buyItemValueAction(player, itemId, slot);
        return;
    }

    // Handles the value option in the shop inventory interface.
    if(widgetId === widgetIds.shop.shopInventory) {
        sellItemValueAction(player, itemId, slot);
        return;
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

    if(widgetId === widgetIds.equipment) {
        unequipItemAction(player, itemId, slot);
    }
};
