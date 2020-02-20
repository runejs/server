import { Player } from '@server/world/mob/player/player';
import { gameCache } from '@server/game-server';

export const buyItemAction = (player: Player, itemId: number, amount: number, slot: number, interfaceId: number) => {

    const purchasedItem = gameCache.itemDefinitions.get(itemId);
    const coinsInInventoryIndex = player.inventory.findIndex(995);
    const amountInStack = player.inventory.amountInStack(coinsInInventoryIndex);
    const amountLeftAfterPurchase = amountInStack - (purchasedItem.value * amount);

    // player.inventory.removeFirst(995);
    player.inventory.add({itemId: 995, amount: amountLeftAfterPurchase});
    player.inventory.add({itemId: itemId, amount: amount});

};