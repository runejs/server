import { itemInteractionActionHandler } from '@engine/world/action/item-interaction.action';
import { itemIds } from '@engine/world/config/item-ids';
import { getItemFromContainer } from '@engine/world/items/item-container';
import { Shop } from '@engine/config/shop-config';
import { widgets } from '@engine/config';


export const action: itemInteractionActionHandler = (details) => {
    const { player, itemId, itemSlot, option, itemDetails } = details;

    if(!player.interfaceState.findWidget(widgets.shop.widgetId)) {
        return;
    }

    const openedShop: Shop = player.metadata['lastOpenedShop'];
    if(!openedShop) {
        return;
    }

    const inventory = player.inventory;
    const inventoryItem = getItemFromContainer(itemId, itemSlot, inventory);

    if(!inventoryItem) {
        // The specified item was not found in the specified slot.
        return;
    }

    const sellAmounts = {
        'sell-1': 1,
        'sell-5': 5,
        'sell-10': 10
    };
    let sellAmount = sellAmounts[option];
    const shopContainer = openedShop.container;
    const shopSpaces = shopContainer.items.filter(item => item === null);

    const shopItemIndex = shopContainer.items.findIndex(item => item !== null && item.itemId === itemId);
    if(shopItemIndex === -1 && shopSpaces.length === 0) {
        player.sendMessage(`There isn't enough space in the shop.`);
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

    const itemValue = openedShop.getBuyPrice(itemDetails); // @TODO scale price per item, not per sale

    if(!shopItem) {
        shopContainer.set(shopContainer.getFirstOpenSlot(), { itemId, amount: sellAmount });
    } else {
        shopItem.amount += sellAmount;
    }

    const sellPrice = sellAmount * itemValue; // @TODO scale price per item, not per sale
    if(sellPrice > 0) {
        let coinsIndex = player.hasCoins(1);

        if(coinsIndex === -1) {
            coinsIndex = inventory.getFirstOpenSlot();
            inventory.set(coinsIndex, { itemId: itemIds.coins, amount: sellPrice });
        } else {
            inventory.items[coinsIndex].amount += sellPrice;
        }
    }

    player.outgoingPackets.sendUpdateAllWidgetItems(widgets.shop, shopContainer);
    player.outgoingPackets.sendUpdateAllWidgetItems(widgets.shopPlayerInventory, inventory);
    player.outgoingPackets.sendUpdateAllWidgetItems(widgets.inventory, inventory);
};

export default {
    type: 'item_action',
    widgets: widgets.shopPlayerInventory,
    options: [ 'sell-1', 'sell-5', 'sell-10' ],
    action,
    cancelOtherActions: false
};
