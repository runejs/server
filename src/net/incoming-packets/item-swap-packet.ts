import { incomingPacket } from '../incoming-packet';
import { Player } from '../../world/actor/player/player';
import { insertItemAction, swapItemAction } from '../../world/actor/player/action/swap-item-action';
import { ByteBuffer } from '@runejs/byte-buffer';

export const itemSwapPacket: incomingPacket = (player: Player, packetId: number, packetSize: number, packet: ByteBuffer): void => {
    const swapType = packet.get();
    const fromSlot = packet.get('SHORT', 'UNSIGNED');
    const toSlot = packet.get('SHORT', 'UNSIGNED', 'LITTLE_ENDIAN');
    const containerId = packet.get('SHORT');
    const widgetId = packet.get('SHORT');

    if(toSlot < 0 || fromSlot < 0) {
        return;
    }

    if(swapType === 0) {
        // Swap
        swapItemAction(player, fromSlot, toSlot, { widgetId, containerId });
    } else if(swapType === 1) {
        insertItemAction(player, fromSlot, toSlot, { widgetId, containerId });
    }
};
