import { getItemFromContainer, itemAction } from '@server/world/actor/player/action/item-action';
import { widgets } from '@server/world/config/widget';
import { ActionType, RunePlugin } from '@server/plugins/plugin';
import { Shop, shopItemContainer } from '@server/world/config/shops';
import { world } from '@server/game-server';
import { ItemContainer } from '@server/world/items/item-container';
import { itemIds } from '@server/world/config/item-ids';

export const action: itemAction = (details) => {
    const { player, itemId, itemSlot, widgetId, containerId, option } = details;

    if(!player.activeWidget || player.activeWidget.widgetId !== widgets.shop.widgetId) {
        console.log('no widget');
        return;
    }

    const openedShop: Shop = player.metadata['lastOpenedShop'];
    if(!openedShop) {
        console.log('no shop');
        return;
    }

    const inventory = player.inventory;
    const inventoryItem = getItemFromContainer(itemId, itemSlot, inventory);

    if(!inventoryItem) {
        // The specified item was not found in the specified slot.
        console.log('no item');
        return;
    }

    const sellAmounts = {
        'sell-1': 1,
        'sell-5': 5,
        'sell-10': 10
    };
    let sellAmount = sellAmounts[option];
    const itemDetails = world.itemData.get(itemId);
    const shopContainer = shopItemContainer(openedShop);
    const shopSpaces = shopContainer.items.filter(item => item === null);

    const shopItemIndex = shopContainer.items.findIndex(item => item !== null && item.itemId === itemId);
    if(shopItemIndex === -1 && shopSpaces.length === 0) {
        player.outgoingPackets.chatboxMessage(`There isn't enough space in the shop.`);
        return;
    }

    const shopItem = shopContainer.items[shopItemIndex];

    if(itemDetails.stackable) {
        if(inventoryItem.amount < sellAmount) {
            inventory.remove(itemSlot);
            sellAmount = inventoryItem.amount;
        } else {
            inventory.set(itemSlot, { itemId, amount: inventoryItem.amount - sellAmount });
        }
    } else {
        const foundItems = inventory.items.map((item, i) => item !== null && item.itemId === itemId ? i : null).filter(i => i !== null);
        if(foundItems.length < sellAmount) {
            sellAmount = foundItems.length;
        }

        for(let i = 0; i < sellAmount; i++) {
            inventory.remove(foundItems[i]);
        }
    }

    const itemValue = itemDetails.value || 0;

    if(!shopItem) {
        shopContainer.set(shopContainer.getFirstOpenSlot(), { itemId, amount: sellAmount });
        openedShop.items.push({ amountInStock: sellAmount, id: itemId, name: itemDetails.name, price: itemValue });
    } else {
        shopItem.amount += sellAmount;
        openedShop.items[shopItemIndex].amountInStock += sellAmount;
    }

    const sellPrice = sellAmount * itemValue; // @TODO player inventory item devaluation/saturation
    if(sellPrice > 0) {
        let coinsIndex = player.hasCoins(1);

        if(coinsIndex === -1) {
            coinsIndex = inventory.getFirstOpenSlot();
            inventory.set(coinsIndex, {itemId: itemIds.coins, amount: sellPrice});
        } else {
            inventory.items[coinsIndex].amount += sellPrice;
        }
    }

    player.outgoingPackets.sendUpdateAllWidgetItems(widgets.shop, shopContainer);
    player.outgoingPackets.sendUpdateAllWidgetItems(widgets.shopPlayerInventory, inventory);
    player.outgoingPackets.sendUpdateAllWidgetItems(widgets.inventory, inventory);
};

export default new RunePlugin({
    type: ActionType.ITEM_ACTION,
    widgets: widgets.shopPlayerInventory,
    options: [ 'sell-1', 'sell-5', 'sell-10' ],
    action,
    cancelOtherActions: false
});
