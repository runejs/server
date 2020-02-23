import { incomingPacket } from '../incoming-packet';
import { Player } from '../../player';
import { RsBuffer } from '@server/net/rs-buffer';
import { swapItemAction } from '../../action/swap-item-action';

export const itemSwapPacket: incomingPacket = (player: Player, packetId: number, packetSize: number, packet: RsBuffer): void => {
    const swapType = packet.readPostNegativeOffsetByte();
    const fromSlot = packet.readNegativeOffsetShortBE();
    const toSlot = packet.readNegativeOffsetShortLE();
    const containerId = packet.readShortBE();
    const widgetId = packet.readShortBE();
    
    if(toSlot < 0 || fromSlot < 0) {
        return;
    }

    if(swapType === 0) {
        // Swap
        swapItemAction(player, fromSlot, toSlot, { widgetId, containerId });
    } else if(swapType === 1) {
        // @TODO insert
    }
};
