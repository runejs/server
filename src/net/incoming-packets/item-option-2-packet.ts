import { incomingPacket } from '../incoming-packet';
import { RsBuffer } from '@server/net/rs-buffer';
import { Player } from '../../world/actor/player/player';
import { itemAction } from '@server/world/actor/player/action/item-action';

export const itemOption2Packet: incomingPacket = (player: Player, packetId: number, packetSize: number, packet: RsBuffer): void => {
    const slot = packet.readShortBE();
    const widgetId = packet.readShortLE();
    const containerId = packet.readShortLE();
    const itemId = packet.readShortBE();
    // packet.readNegativeOffsetShortBE();
    // packet.readUnsignedShortLE();
    // packet.readShortLE(); // either widget id or container id
    // packet.readShortLE(); // either widget id or container id
    //
    // Class32.packetBuffer.putShortBE(i);
    // Class32.packetBuffer.putIntME1(i_10_);
    // Class32.packetBuffer.putShortBE(i_12_);
    //
    // Class32.packetBuffer.putCustomNegativeOffsetShortBE(i_12_, -128);
    // Class32.packetBuffer.putShortLE(i);
    // Class32.packetBuffer.putIntME1(i_10_);

    // @TODO parse widgets and find actual item option NAME to pass to this
    itemAction(player, itemId, slot, widgetId, containerId, 'option-2');

    /*
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
    }*/
};
