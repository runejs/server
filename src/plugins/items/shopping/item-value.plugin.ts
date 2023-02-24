import { itemInteractionActionHandler } from '@engine/action';
import { Shop } from '@engine/config/shop-config';
import { findItem, findShop, widgets } from '@engine/config/config-handler';
import { getItemFromContainer } from "@engine/world";

export const shopSellValueHandler: itemInteractionActionHandler = (details) => {
    const { player, itemId, itemSlot, widgetId, option } = details;

    if(!player.interfaceState.findWidget(widgetId)) {
        return;
    }

    const openedShopKey = player.metadata.lastOpenedShopKey;
    if(!openedShopKey) {
        return;
    }

    const shop = findShop(openedShopKey);
    if(!shop) {
        return;
    }

    const shopContainer = shop.container;
    const shopItem = getItemFromContainer(itemId, itemSlot, shopContainer);
    console.log(itemId, itemSlot, openedShopKey, shopContainer);

    if(!shopItem) {
        // The specified item was not found in the specified slot.
        player.sendMessage(`ERROR item not in shopslot.`);
        return;
    }

    if(shopItem.amount <= 0) {
        player.sendMessage(`The shop has ran out of stock.`);
        // Out of stock
        return;
    }
    const buyItem = findItem(itemId);
    if(!buyItem) {
        // The specified item was not found in the specified slot.
        player.sendMessage(`Error item does not exist. [id:${itemId}]`);
        return;
    }
    player.sendMessage(`${buyItem.name}: currently costs ${shop.getBuyPrice(buyItem)} coins.`);
};

export const shopPurchaseValueHandler: itemInteractionActionHandler = ({ player, itemDetails }) => {
    const openedShopKey = player.metadata.lastOpenedShopKey;
    if(!openedShopKey) {
        return;
    }

    const shop = findShop(openedShopKey);
    if(!shop) {
        return;
    }

    const shopBuyPrice = shop.getBuyPrice(itemDetails);

    if(shopBuyPrice === -1) {
        player.sendMessage(`You can't sell this item to this shop.`);
    } else {
        player.sendMessage(`${ itemDetails.name }: shop will buy for ${ shopBuyPrice } coins.`);
    }
};

export default {
    pluginId: 'rs:shop_item_value',
    hooks: [
        {
            type: 'item_interaction',
            widgets: widgets.shop,
            options: 'value',
            handler: shopSellValueHandler,
            cancelOtherActions: false
        }, {
            type: 'item_interaction',
            widgets: widgets.shopPlayerInventory,
            options: 'value',
            handler: shopPurchaseValueHandler,
            cancelOtherActions: false
        }
    ]
};
