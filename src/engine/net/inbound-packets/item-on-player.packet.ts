import { logger } from '@runejs/common';
import { activeWorld, World } from '@engine/world';
import { widgets } from '@engine/config';
import { Player } from '@engine/world/actor';
import { PacketData } from '@engine/net';

const itemOnPlayerPacket = (player: Player, packet: PacketData) => {
    const { buffer } = packet;
    const playerIndex = buffer.get('short', 'u', 'le') - 1;
    const itemWidgetId = buffer.get('short', 's', 'le');
    const itemContainerId = buffer.get('short');
    const itemId = buffer.get('short', 'u');
    const itemSlot = buffer.get('short', 'u');


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


    if(playerIndex < 0 || playerIndex > World.MAX_PLAYERS - 1) {
        return;
    }

    const otherPlayer = activeWorld.playerList[playerIndex];
    if(!otherPlayer) {
        return;
    }


    const position = otherPlayer.position;
    const distance = Math.floor(position.distanceBetween(player.position));



    // Too far away
    if(distance > 16) {
        return;
    }


    player.actionPipeline.call('item_on_player', player, otherPlayer, position, usedItem, itemWidgetId, itemContainerId)
};

export default {
    opcode: 110,
    size: 10,
    handler: itemOnPlayerPacket
};
