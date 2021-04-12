import { logger } from '@runejs/core';
import { world } from '../../game-server';
import { World } from '../../world';
import { widgets } from '../../config';

const itemOnNpcPacket = (player, packet) => {
    const { buffer } = packet;
    const npcIndex = buffer.get('short', 'u');
    const itemId = buffer.get('short', 'u');
    const itemSlot = buffer.get('short', 'u', 'le');
    const itemWidgetId = buffer.get('short');
    const itemContainerId = buffer.get('short');

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

    player.actionPipeline.call('item_on_npc', player, npc, position, usedItem, itemWidgetId, itemContainerId)
};

export default {
    opcode: 208,
    size: 10,
    handler: itemOnNpcPacket
};
