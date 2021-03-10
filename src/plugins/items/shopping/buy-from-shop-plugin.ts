import { itemActionHandler } from '@engine/world/action/item.action';
import { Item } from '@engine/world/items/item';
import { getItemFromContainer, ItemContainer } from '@engine/world/items/item-container';
import { itemIds } from '@engine/world/config/item-ids';
import { findItem, widgets } from '@engine/config';
import { Shop } from '@engine/config/shop-config';


function removeCoins(inventory: ItemContainer, coinsIndex: number, cost: number): void {
    const coins = inventory.items[coinsIndex];
    const amountAfterPurchase = coins.amount - cost;
    inventory.set(coinsIndex, { itemId: itemIds.coins, amount: amountAfterPurchase });
}

export const action: itemActionHandler = (details) => {
    const { player, itemId, itemSlot, widgetId, option } = details;

    if(!player.interfaceState.findWidget(widgetId)) {
        return;
    }

    const openedShop: Shop = player.metadata['lastOpenedShop'];
    if(!openedShop) {
        return;
    }

    const shopContainer = openedShop.container;
    const shopItem = getItemFromContainer(itemId, itemSlot, shopContainer);

    if(!shopItem) {
        // The specified item was not found in the specified slot.
        return;
    }

    if(shopItem.amount <= 0) {
        // Out of stock
        return;
    }

    const buyAmounts = {
        'buy-1': 1,
        'buy-5': 5,
        'buy-10': 10
    };
    let buyAmount = buyAmounts[option];
    if(shopItem.amount < buyAmount) {
        buyAmount = shopItem.amount;
    }

    const buyItem = findItem(itemId);
    const buyItemValue = buyItem.value || 0;
    let buyCost = buyAmount * buyItemValue;
    const coinsIndex = player.hasCoins(buyCost);

    if(coinsIndex === -1) {
        player.sendMessage(`You don't have enough coins.`);
        return;
    }

    const inventory = player.inventory;

    if(buyItem.stackable) {
        const inventoryStackSlot = inventory.items.findIndex(item => itemId === itemId);

        if(inventoryStackSlot === -1) {
            if(inventory.getFirstOpenSlot() === -1) {
                player.sendMessage(`You don't have enough space in your inventory.`);
                return;
            }
        } else {
            const inventoryItem = inventory.items[inventoryStackSlot];
            if(inventoryItem.amount + buyAmount >= 2147483647) {
                player.sendMessage(`You don't have enough space in your inventory.`);
                return;
            }

            shopContainer.set(itemSlot, { itemId, amount: shopItem.amount - buyAmount });
            removeCoins(inventory, coinsIndex, buyCost);

            const item: Item = {
                itemId, amount: inventoryItem.amount + buyAmount
            };

            inventory.set(inventoryStackSlot, item);
        }
    } else {
        let bought = 0;

        for(let i = 0; i < buyAmount; i++) {
            if(inventory.add({ itemId, amount: 1 }) !== null) {
                bought++;
            } else {
                break;
            }
        }

        if(bought !== buyAmount) {
            player.sendMessage(`You don't have enough space in your inventory.`);
        }

        shopContainer.set(itemSlot, { itemId, amount: shopItem.amount - bought });
        buyCost = bought * buyItemValue;
        removeCoins(inventory, coinsIndex, buyCost);
    }

    player.outgoingPackets.sendUpdateSingleWidgetItem(widgets.shop, itemSlot, shopContainer.items[itemSlot]);
    player.outgoingPackets.sendUpdateAllWidgetItems(widgets.shopPlayerInventory, inventory);
    player.outgoingPackets.sendUpdateAllWidgetItems(widgets.inventory, inventory);
};

export default {
    type: 'item_action',
    widgets: widgets.shop,
    options: [ 'buy-1', 'buy-5', 'buy-10' ],
    action,
    cancelOtherActions: false
};
