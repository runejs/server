import type { itemInteractionActionHandler } from '@engine/action/pipe/item-interaction.action';
import { findShop, widgets } from '@engine/config/config-handler';
import { itemIds } from '@engine/world/config/item-ids';
import { getItemFromContainer } from '@engine/world/items/item-container';

export const handler: itemInteractionActionHandler = details => {
    const { player, itemId, itemSlot, option, itemDetails } = details;

    if (!player.interfaceState.findWidget(widgets.shop.widgetId)) {
        return;
    }

    const openedShopKey = player.metadata.lastOpenedShopKey;
    if (!openedShopKey) {
        return;
    }

    const shop = findShop(openedShopKey);
    if (!shop) {
        return;
    }

    const inventory = player.inventory;
    const inventoryItem = getItemFromContainer(itemId, itemSlot, inventory);

    if (!inventoryItem) {
        // The specified item was not found in the specified slot.
        return;
    }

    const sellAmounts = {
        'sell-1': 1,
        'sell-5': 5,
        'sell-10': 10,
    };
    let sellAmount = sellAmounts[option];
    const shopContainer = shop.container;
    const shopSpaces = shopContainer.items.filter(item => item === null);

    const shopItemIndex = shopContainer.items.findIndex(item => item !== null && item.itemId === itemId);
    if (shopItemIndex === -1 && shopSpaces.length === 0) {
        player.sendMessage(`There isn't enough space in the shop.`);
        return;
    }

    const shopItem = shopContainer.items[shopItemIndex];

    if (itemDetails.stackable) {
        if (inventoryItem.amount < sellAmount) {
            inventory.remove(itemSlot);
            sellAmount = inventoryItem.amount;
        } else {
            inventory.set(itemSlot, { itemId, amount: inventoryItem.amount - sellAmount });
        }
    } else {
        const inventorySlots: number[] = inventory.items
            // Get all the inventory slots that contain the item we are selling.
            .map((item, i) => (item !== null && item.itemId === itemId ? i : null))
            .filter(i => i !== null);

        if (inventorySlots.length < sellAmount) {
            sellAmount = inventorySlots.length;
        }

        for (let i = 0; i < sellAmount; i++) {
            const itemSlot = inventorySlots[i];

            if (itemSlot == null) {
                throw new Error(`Inventory item was not present, for item id ${itemId} in inventory, while trying to sell`);
            }

            inventory.remove(itemSlot);
        }
    }

    const itemValue = shop.getSellToShopPrice(itemDetails); // @TODO scale price per item, not per sale

    if (!shopItem) {
        shopContainer.set(shopContainer.getFirstOpenSlot(), { itemId, amount: sellAmount });
    } else {
        shopItem.amount += sellAmount;
    }

    const sellPrice = sellAmount * itemValue; // @TODO scale price per item, not per sale
    if (sellPrice > 0) {
        let coinsIndex = player.hasCoins(1);

        if (coinsIndex === -1) {
            coinsIndex = inventory.getFirstOpenSlot();
            inventory.set(coinsIndex, { itemId: itemIds.coins, amount: sellPrice });
        } else {
            // TODO (Jameskmonger) consider being explicit to prevent dupes
            inventory.items[coinsIndex]!.amount += sellPrice;
        }
    }

    player.outgoingPackets.sendUpdateAllWidgetItems(widgets.shop, shopContainer);
    player.outgoingPackets.sendUpdateAllWidgetItems(widgets.shopPlayerInventory, inventory);
    player.outgoingPackets.sendUpdateAllWidgetItems(widgets.inventory, inventory);
};

export default {
    pluginId: 'rs:shop_sell',
    hooks: [
        {
            type: 'item_interaction',
            widgets: widgets.shopPlayerInventory,
            options: ['sell-1', 'sell-5', 'sell-10'],
            handler,
            cancelOtherActions: false,
        },
    ],
};
