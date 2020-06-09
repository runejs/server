import { incomingPacket } from '../incoming-packet';
import { Player } from '../../world/actor/player/player';
import { widgets } from '@server/world/config/widget';
import { logger } from '@runejs/logger';
import { world } from '@server/game-server';
import { World } from '@server/world/world';
import { itemOnNpcAction } from '@server/world/actor/player/action/item-on-npc-action';
import { ByteBuffer } from '@runejs/byte-buffer';

export const itemOnNpcPacket: incomingPacket = (player: Player, packetId: number, packetSize: number, packet: ByteBuffer): void => {
    const npcIndex = packet.get('SHORT', 'UNSIGNED');
    const itemId = packet.get('SHORT', 'UNSIGNED');
    const itemSlot = packet.get('SHORT', 'UNSIGNED', 'LITTLE_ENDIAN');
    const itemWidgetId = packet.get('SHORT');
    const itemContainerId = packet.get('SHORT');

    let usedItem;
    if(itemWidgetId === widgets.inventory.widgetId && itemContainerId === widgets.inventory.containerId) {
        if(itemSlot < 0 || itemSlot > 27) {
            return;
        }

        usedItem = player.inventory.items[itemSlot];
        if(!usedItem) {
            return;
        }

        if(usedItem.itemId !== itemId) {
            return;
        }
    } else {
        logger.warn(`Unhandled item on object case using widget ${ itemWidgetId }:${ itemContainerId }`);
    }


    if(npcIndex < 0 || npcIndex > World.MAX_NPCS - 1) {
        return;
    }

    const npc = world.npcList[npcIndex];
    if(!npc) {
        return;
    }

    const position = npc.position;
    const distance = Math.floor(position.distanceBetween(player.position));

    // Too far away
    if(distance > 16) {
        return;
    }

    itemOnNpcAction(player, npc, position, usedItem, itemWidgetId, itemContainerId);

};
