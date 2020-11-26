import { ItemContainer } from '@server/world/items/item-container';
import { findItem, loadConfigurationFiles } from '@server/config/index';
import { Player } from '@server/world/actor/player/player';
import { widgets } from '@server/world/config/widget';


export type ShopStock = [ [ string, number ] ];

export class Shop {

    public readonly key: string;
    public readonly originalStock: ShopStock;
    public readonly container: ItemContainer;
    public readonly originalSellRate: number;
    public readonly originalBuyRate: number;
    public name: string;
    public sellRate: number;
    public buyRate: number;
    public rateModifier: number;

    public constructor(key: string, name: string, stock: ShopStock, sellRate: number, buyRate: number, modifier: number) {
        this.key = key;
        this.name = name;
        this.buyRate = buyRate;
        this.sellRate = sellRate;
        this.originalBuyRate = buyRate;
        this.originalSellRate = sellRate;
        this.rateModifier = modifier;
        this.originalStock = stock;
        this.container = new ItemContainer(40);
        this.resetShopStock();
    }

    public resetShopStock(): void {
        for(let i = 0; i < this.container.size; i++) {
            if(this.originalStock[i]) {
                const [ itemKey, amount ] = this.originalStock[i];
                const itemDetails = findItem(itemKey);
                this.container.set(i, !itemDetails ? null : { itemId: itemDetails.gameId, amount: amount || 0 }, false);
            } else {
                this.container.set(i, null, false);
            }
        }
    }

    public open(player: Player): void {
        player.metadata['lastOpenedShop'] = this;
        player.outgoingPackets.updateWidgetString(widgets.shop.widgetId, widgets.shop.title, this.name);
        player.outgoingPackets.sendUpdateAllWidgetItems(widgets.shop, this.container);
        player.outgoingPackets.sendUpdateAllWidgetItems(widgets.shopPlayerInventory, player.inventory);

        player.activeWidget = {
            widgetId: widgets.shop.widgetId,
            secondaryWidgetId: widgets.shopPlayerInventory.widgetId,
            type: 'SCREEN_AND_TAB',
            closeOnWalk: true
        };
    }

}

export interface ShopConfiguration {
    name: string;
    shop_sell_rate?: number;
    shop_buy_rate?: number;
    rate_modifier?: number;
    stock: ShopStock;
}

export function shopFactory(key: string, config: ShopConfiguration): Shop {
    return new Shop(key, config.name, config.stock,
        config.shop_sell_rate || 100, config.shop_buy_rate || 0.65, config.rate_modifier || 0.2);
}

export async function loadShopConfigurations(path: string): Promise<{ [key: string]: Shop }> {
    const shops: { [key: string]: Shop } = {};

    const files = await loadConfigurationFiles(path);
    files.forEach(shopConfigs => {
        const shopKeys = Object.keys(shopConfigs);
        shopKeys.forEach(key => {
            shops[key] = shopFactory(key, shopConfigs[key]);
        });
    });

    return shops;
}
