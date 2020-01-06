import { incomingPacket } from '../incoming-packet';
import { RsBuffer } from '@server/net/rs-buffer';
import { Player } from '../../player';
import { interfaceIds } from '../../game-interface';
import { logger } from '@runejs/logger/dist/logger';
import { unequipItemAction } from '../../action/unequip-item-action';
import { ItemContainer } from '@server/world/items/item-container';

export const itemOption1Packet: incomingPacket = (player: Player, packetId: number, packetSize: number, packet: RsBuffer): void => {
    const itemId = packet.readNegativeOffsetShortBE();
    const interfaceId = packet.readShortBE();
    const slot = packet.readShortBE();

    let container: ItemContainer = null;

    if(interfaceId === interfaceIds.equipment) {
        container = player.equipment;
    }

    if(!container) {
        logger.info(`Unhandled item option 1: ${interfaceId}, ${slot}, ${itemId}`);
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

    if(interfaceId === interfaceIds.equipment) {
        unequipItemAction(player, itemId, slot);
    }
};
