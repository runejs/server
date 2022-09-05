import { logger } from '@runejs/common';
import { widgets } from '@engine/config';
import { Player } from '@engine/world/actor';
import { PacketData } from '@engine/net';
import { Position } from '@engine/world';

/**
 * Parses the item on world item packet and calls the `item_on_world_item` action pipeline.
 *
 * This will check that the item being used is in the player's inventory, and that the world item exists in the correct location.
 * The action pipeline will not be called if either of these conditions are not met.
 *
 * @param player The player that sent the packet.
 * @param packet The packet to parse.
 *
 * @author jameskmonger
 */
const itemOnWorldItemPacket = (player: Player, packet: PacketData) => {
    const { buffer } = packet;

    const usedWithX = buffer.get('short', 'u');
    const usedSlot = buffer.get('short', 'u');
    const usedWithItemId = buffer.get('short', 'u');
    const usedContainerId = buffer.get('short', 's', 'be');
    const usedWidgetId = buffer.get('short', 's', 'be');
    const usedWithY = buffer.get('short', 'u', 'le');
    const usedItemId = buffer.get('short', 'u', 'le');

    const position = new Position(usedWithX, usedWithY, player.position.level);

    if(usedWidgetId === widgets.inventory.widgetId && usedContainerId === widgets.inventory.containerId) {
        // TODO (James) we should use constants for these rather than magic numbers
        if(usedSlot < 0 || usedSlot > 27) {
            return;
        }

        const usedItem = player.inventory.items[usedSlot];
        const usedWithItem = player.instance.getTileModifications(position).mods.worldItems.find(p => p.itemId === usedWithItemId);
        if(!usedItem || !usedWithItem) {
            logger.warn(`Unhandled item on world item case (A) for ${usedSlot} (${usedItemId}) on ${usedWithItemId} (${usedWithX}, ${usedWithY}) by ${player.username}`);
            return;
        }

        if(usedItem.itemId !== usedItemId || usedWithItem.itemId !== usedWithItemId) {
            logger.warn(`Unhandled item on world item case (B) for ${usedItem.itemId}:${usedItemId} on ${usedWithItem.itemId}:${usedWithItemId} by ${player.username}`);
            return;
        }

        player.actionPipeline.call('item_on_world_item', player, usedItem, usedWithItem, usedWidgetId, usedContainerId, usedSlot);
    } else {
        logger.warn(`Unhandled item on world item case (C) using widgets ${usedWidgetId}:${usedContainerId} by ${player.username}`);
    }

};

export default {
    opcode: 172,
    size: 14,
    handler: itemOnWorldItemPacket
};
