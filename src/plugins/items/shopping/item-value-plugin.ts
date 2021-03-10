import { itemActionHandler } from '@engine/world/action/item.action';
import { Shop } from '@engine/config/shop-config';
import { widgets } from '@engine/config';

export const shopSellValueAction: itemActionHandler = ({ player, itemDetails }) => {
    const itemValue = itemDetails.value || 1;
    player.sendMessage(`${itemDetails.name}: currently costs ${itemValue} coins.`);
};

export const shopPurchaseValueAction: itemActionHandler = ({ player, itemDetails }) => {
    const openedShop: Shop = player.metadata['lastOpenedShop'];
    if(!openedShop) {
        return;
    }

    const shopBuyPrice = openedShop.getBuyPrice(itemDetails);

    if(shopBuyPrice === -1) {
        player.sendMessage(`You can't sell this item to this shop.`);
    } else {
        player.sendMessage(`${ itemDetails.name }: shop will buy for ${ shopBuyPrice } coins.`);
    }
};

export default [{
    type: 'item_action',
    widgets: widgets.shop,
    options: 'value',
    action: shopSellValueAction,
    cancelOtherActions: false
}, {
    type: 'item_action',
    widgets: widgets.shopPlayerInventory,
    options: 'value',
    action: shopPurchaseValueAction,
    cancelOtherActions: false
}];
