import { ContainerUpdateEvent, ItemContainer } from '@engine/world/items/item-container';
import { findItem, widgets } from '@engine/config/config-handler';
import { loadConfigurationFiles } from '@runejs/common/fs';
import { Player } from '@engine/world/actor/player/player';
import { ItemDetails } from '@engine/config/item-config';
import { WidgetClosedEvent } from '@engine/interface';
import { Subscription } from 'rxjs';


export type ShopStock = { itemKey: string, amount: number, restock?: number }[];

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
    private customers: Player[];
    private containerSubscription: Subscription;

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
        this.containerSubscription = this.container.containerUpdated.subscribe((_update: ContainerUpdateEvent) => this.updateCustomers());
        this.customers = [];
        this.resetShopStock();
    }

    public resetShopStock(): void {
        for (let i = 0; i < this.container.size; i++) {
            if (this.originalStock[i]) {
                const { itemKey, amount } = this.originalStock[i];
                const itemDetails = findItem(itemKey);
                this.container.set(i, !itemDetails ? null : { itemId: itemDetails.gameId, amount: amount || 0 }, false);
            } else {
                this.container.set(i, null, false);
            }
        }
    }

    /**
     * Get the price to purchase an item from shop
     * @param item to purchase from shop
     * @return price which item is available for purchase at
     */
    public getBuyFromShopPrice(item: ItemDetails): number {
        const itemKey = item.key;
        const itemSoldHere: boolean = this.isItemSoldHere(itemKey);
        let originalStockAmount: number = 0;
        const itemStock = this.container.amount(item.gameId);

        if (itemSoldHere) {
            const foundStock = this.originalStock.find(stock => stock && stock.itemKey === itemKey);
            if (foundStock) {
                originalStockAmount = foundStock.amount;
            }
        } else {

            return -1; // Cannot buy from this shop
        }

        let finalAmount: number;
        if (itemStock === originalStockAmount) {
            finalAmount = Math.round(item.value * this.sellRate);
        } else if (itemStock > originalStockAmount) {
            const overstockAmount = (itemStock - originalStockAmount);
            let shopSellRate = this.sellRate;
            shopSellRate -= (this.rateModifier * overstockAmount);
            finalAmount = item.value * shopSellRate;

            finalAmount = Math.round(finalAmount);
        } else {
            const understockAmount = (originalStockAmount - itemStock);
            let shopSellRate = this.sellRate;
            shopSellRate += (this.rateModifier * understockAmount);
            finalAmount = item.value * shopSellRate;

            finalAmount = Math.round(finalAmount);
        }

        const min = item.minimumValue || 1;
        return finalAmount < min ? min : finalAmount;
    }

    /**
     * Price which shop pays player for.
     * @param item
     */
    public getSellToShopPrice(item: ItemDetails): number {
        const itemKey = item.key;
        const itemSoldHere: boolean = this.isItemSoldHere(itemKey);
        let originalStockAmount: number = 0;
        const itemStock = this.container.amount(item.gameId);


        if (itemSoldHere) {
            originalStockAmount = this.originalStock.find(stock => stock && stock.itemKey === itemKey)?.amount || 0;
        } else if (!this.generalStore) {
            return -1; // Can not sell this item to this shop (shop is not a general store!)
        }

        let finalAmount: number;

        if (itemStock === originalStockAmount) {
            finalAmount = Math.round(item.value * this.buyRate);
        } else if (itemStock > originalStockAmount) {
            const overstockAmount = (itemStock - originalStockAmount);
            let shopBuyRate = this.buyRate;
            shopBuyRate -= (this.rateModifier * overstockAmount);
            finalAmount = item.value * shopBuyRate;

            finalAmount = Math.round(finalAmount);
        } else {
            const understockAmount = (originalStockAmount - itemStock);
            let shopBuyRate = this.buyRate;
            shopBuyRate += (this.rateModifier * understockAmount);
            finalAmount = item.value * shopBuyRate;

            finalAmount = Math.round(finalAmount);
        }

        const min = item.minimumValue || 0;
        return finalAmount < min ? min : finalAmount;
    }

    public isItemSoldHere(itemKey: string): boolean {
        return this.originalStock.some(stockedItem => stockedItem.itemKey === itemKey);
    }

    public open(player: Player): void {
        player.metadata.lastOpenedShopKey = this.key;
        player.metadata.shopCloseListener = player.interfaceState.closed.subscribe((whatClosed: WidgetClosedEvent) => {
            if (whatClosed && whatClosed.widget && whatClosed.widget.widgetId === widgets.shop.widgetId) {
                this.removePlayerFromShop(player);
            }
        });

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
        this.customers.push(player);
    }

    private updateCustomers() {
        for (const player of this.customers) {
            if (player.metadata.lastOpenedShopKey === this.key) {
                player.outgoingPackets.sendUpdateAllWidgetItems(widgets.shop, this.container);
            } else {
                this.removePlayerFromShop(player);
            }
        }
    }

    private removePlayerFromShop(player: Player) {
        if (player.metadata.lastOpenedShopKey === this.key) {
            delete player.metadata.lastOpenedShopKey;
            player.metadata.shopCloseListener?.unsubscribe();
        }
        this.customers = this.customers.filter((c) => c !== player);
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
        config.shop_sell_rate || 1.00, config.shop_buy_rate || 0.65, config.rate_modifier || 0.2);
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
