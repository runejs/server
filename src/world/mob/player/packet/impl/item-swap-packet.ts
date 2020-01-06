import { incomingPacket } from '../incoming-packet';
import { Player } from '../../player';
import { RsBuffer } from '@server/net/rs-buffer';
import { swapItemAction } from '../../action/swap-item-action';

export const itemSwapPacket: incomingPacket = (player: Player, packetId: number, packetSize: number, packet: RsBuffer): void => {
    const toSlot = packet.readNegativeOffsetShortLE();
    const swapType = packet.readPostNegativeOffsetByte();
    const interfaceId = packet.readNegativeOffsetShortBE();
    const fromSlot = packet.readShortLE();

    if(toSlot < 0 || fromSlot < 0) {
        return;
    }

    if(swapType === 0) {
        // Swap
        swapItemAction(player, fromSlot, toSlot, interfaceId);
    } else if(swapType === 1) {
        // @TODO insert
    }
};
