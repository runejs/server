import { itemInteractionActionHandler } from '@engine/action';
import { Shop } from '@engine/config/shop-config';
import { findShop, widgets } from '@engine/config/config-handler';

export const shopSellValueHandler: itemInteractionActionHandler = ({ player, itemDetails }) => {
    const itemValue = itemDetails.value || 1;
    player.sendMessage(`${itemDetails.name}: currently costs ${itemValue} coins.`);
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
