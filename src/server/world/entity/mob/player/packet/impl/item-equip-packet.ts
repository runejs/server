import { incomingPacket } from '../incoming-packet';
import { Player } from '../../player';
import { RsBuffer } from '../../../../../../net/rs-buffer';
import { logger } from '@runejs/logger/dist/logger';
import { interfaceIds } from '../../game-interface';
import { equipItemAction } from '../../action/equip-item-action';

export const itemEquipPacket: incomingPacket = (player: Player, packetId: number, packetSize: number, packet: RsBuffer): void => {
    const interfaceId = packet.readShortLE();
    const itemId = packet.readShortLE();
    const slot = packet.readNegativeOffsetShortBE();

    if(interfaceId !== interfaceIds.inventory) {
        logger.warn(`${player.username} attempted to equip item from incorrect interface id ${interfaceId}.`);
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

    console.log(`item equip packet {${interfaceId}, ${itemId}, ${slot}`);
    equipItemAction(player, itemId, slot);
};
