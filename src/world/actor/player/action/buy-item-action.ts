import { Player } from '@server/world/actor/player/player';
import { gameCache } from '@server/game-server';
import { widgetIds } from '@server/world/actor/player/widget';

export const buyItemAction = (player: Player, itemId: number, amount: number, slot: number, interfaceId: number) => {

    const purchasedItem = gameCache.itemDefinitions.get(itemId);
    const coinsInInventoryIndex = player.inventory.findIndex(995);

    if(coinsInInventoryIndex === -1) {
        player.outgoingPackets.chatboxMessage(`You don't have enough coins.`);
        return;
    }

    if(interfaceId !== widgetIds.shop.shopInventory) {
        return;
    }

    const amountInStack = player.inventory.amountInStack(coinsInInventoryIndex);
    const amountLeftAfterPurchase = amountInStack - (purchasedItem.value * amount);

    if(amountLeftAfterPurchase < 0) {
        player.outgoingPackets.chatboxMessage(`You don't have enough coins.`);
        return;
    }

    // Take the money.
    player.inventory.set(player.inventory.findIndex(itemId), { itemId, amount: amount});
    player.inventory.set(coinsInInventoryIndex, {itemId: 995, amount: amountLeftAfterPurchase});

    // Add the purchased item(s) to the inventory.
    if(amount > 1) {
        for (let i = 0; i < amount; i++) {
            player.inventory.add(itemId);
        }
    }

    if(amount === 1) {
        player.inventory.add(itemId);
    }

    if(interfaceId === widgetIds.shop.shopInventory) {
        console.log(interfaceId, widgetIds.shop.shopInventory);
        player.outgoingPackets.sendUpdateAllWidgetItems(widgetIds.shop.playerInventory, player.inventory);
    }

    // Update the inventory items.
    player.outgoingPackets.sendUpdateAllWidgetItems(widgetIds.inventory, player.inventory);

};
