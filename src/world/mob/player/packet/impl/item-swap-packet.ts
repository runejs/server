import { incomingPacket } from '../incoming-packet';
import { Player } from '../../player';
import { RsBuffer } from '@server/net/rs-buffer';
import { swapItemAction } from '../../action/swap-item-action';

export const itemSwapPacket: incomingPacket = (player: Player, packetId: number, packetSize: number, packet: RsBuffer): void => {
    const swapType = packet.readPostNegativeOffsetByte();
    const fromSlot = packet.readNegativeOffsetShortBE();
    const toSlot = packet.readNegativeOffsetShortLE();
    const widgetId = packet.readIntME2();

    const part1 = widgetId >> 799918864;
    const part2 = widgetId >> 1441108912;

    console.log(`item swap type ${swapType} : ${fromSlot} to ${toSlot} in ${part1},${part2}`);

    if(toSlot < 0 || fromSlot < 0) {
        return;
    }

    if(swapType === 0) {
        // Swap
        // swapItemAction(player, fromSlot, toSlot, widgetId);
    } else if(swapType === 1) {
        // @TODO insert
    }
};
