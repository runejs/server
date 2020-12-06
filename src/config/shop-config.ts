import { ItemContainer } from '@server/world/items/item-container';
import { findItem, loadConfigurationFiles, widgets } from '@server/config/index';
import { Player } from '@server/world/actor/player/player';
import { ItemDetails } from '@server/config/item-config';


export type ShopStock = [ [ string, number ] ];

export class Shop {

    public readonly key: string;
    public readonly originalStock: ShopStock;
    public readonly container: ItemContainer;
    public readonly originalSellRate: number;
    public readonly originalBuyRate: number;
    public readonly generalStore: boolean;
    public name: string;
    public sellRate: number;
    public buyRate: number;
    public rateModifier: number;

    public constructor(key: string, name: string, generalStore: boolean, stock: ShopStock, sellRate: number, buyRate: number, modifier: number) {
        this.key = key;
        this.name = name;
        this.generalStore = generalStore;
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

    public getBuyPrice(item: ItemDetails): number {
        const itemKey = item.key;
        const itemSoldHere: boolean = this.isItemSoldHere(itemKey);
        let originalStockAmount: number = 0;
        const itemStock = this.container.amount(item.gameId);

        if(itemSoldHere) {
            originalStockAmount = this.originalStock.find(stock => stock && stock[0] === itemKey)[1];
        } else if(!this.generalStore) {
            return -1; // Can not sell this item to this shop (shop is not a general store!)
        }

        let finalAmount: number;

        if(itemStock > originalStockAmount) {
            const overstockAmount = (itemStock - originalStockAmount);

            if(this.generalStore) {
                const decrementAmount = 0.075 * overstockAmount;
                finalAmount = item.lowAlchValue - decrementAmount;
            } else {
                let shopBuyRate = this.buyRate;
                shopBuyRate -= (this.rateModifier * overstockAmount);
                finalAmount = item.value * shopBuyRate;
            }

            finalAmount = Math.round(finalAmount);
        } else {
            finalAmount = this.generalStore ? item.lowAlchValue : Math.round(item.value * this.buyRate);
        }

        const min = item.minimumValue || 0;
        return finalAmount < min ? min : finalAmount;
    }

    public isItemSoldHere(itemKey: string): boolean {
        for(const stock of this.originalStock) {
            if(stock && stock[0] === itemKey) {
                return true;
            }
        }
        return false;
    }

    public open(player: Player): void {
        player.metadata['lastOpenedShop'] = this;
        player.outgoingPackets.updateWidgetString(widgets.shop.widgetId, widgets.shop.title, this.name);
        player.outgoingPackets.sendUpdateAllWidgetItems(widgets.shop, this.container);
        player.outgoingPackets.sendUpdateAllWidgetItems(widgets.shopPlayerInventory, player.inventory);

        player.interfaceState.openWidget(widgets.shop.widgetId, {
            slot: 'screen',
            multi: true
        });
        player.interfaceState.openWidget(widgets.shopPlayerInventory.widgetId, {
            slot: 'tabarea',
            multi: true
        });
    }

}

export interface ShopConfiguration {
    name: string;
    general_store?: boolean;
    shop_sell_rate?: number;
    shop_buy_rate?: number;
    rate_modifier?: number;
    stock: ShopStock;
}

export function shopFactory(key: string, config: ShopConfiguration): Shop {
    return new Shop(key, config.name, config.general_store || false, config.stock,
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
