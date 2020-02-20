import { incomingPacket } from '@server/world/mob/player/packet/incoming-packet';
import { Player } from '@server/world/mob/player/player';
import { RsBuffer } from '@server/net/rs-buffer';
import { gameCache } from '@server/game-server';
import { buyItemAction } from '@server/world/mob/player/action/buy-item-action';

export const buyItemPacket: incomingPacket = (player: Player, packetId: number, packetSize: number, packet: RsBuffer): void => {

    if(packetId === 177) {
        const slot = packet.readNegativeOffsetShortBE();
        const itemId = packet.readShortLE();
        const interfaceId = packet.readShortLE();

        if(player.inventory.findItemIndex({itemId: 995, amount: gameCache.itemDefinitions.get(itemId).value}) === undefined) {
            player.packetSender.chatboxMessage(`You don't have enough coins.`);
            return;
        }

        buyItemAction(player, itemId, 1, slot, interfaceId);
    }

    if(packetId === 91) {
        const itemId = packet.readShortLE();
        const slot = packet.readNegativeOffsetShortLE();
        const interfaceId = packet.readShortBE();

        if(player.inventory.findItemIndex({itemId: 995, amount: gameCache.itemDefinitions.get(itemId).value * 5}) === undefined) {
            player.packetSender.chatboxMessage(`You don't have enough coins.`);
            return;
        }

        buyItemAction(player, itemId, 5, slot, interfaceId);
    }

    if(packetId === 231) {
        const interfaceId = packet.readNegativeOffsetShortLE();
        const slot = packet.readShortLE();
        const itemId = packet.readShortBE();

        if(player.inventory.findItemIndex({itemId: 995, amount: gameCache.itemDefinitions.get(itemId).value * 10}) === undefined) {
            player.packetSender.chatboxMessage(`You don't have enough coins.`);
            return;
        }

        buyItemAction(player, itemId, 10, slot, interfaceId);
    }

    return;
};