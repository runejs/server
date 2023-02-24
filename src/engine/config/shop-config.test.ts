import { setupConfig } from '@server/game';
import { Shop, ShopConfiguration, shopFactory } from '@engine/config/shop-config';
import { findItem, findShop, widgets } from '@engine/config/config-handler';

describe('shopping', () => {

    const shopConfig: ShopConfiguration = {
        name: 'Test General Store',
        general_store: true,
        shop_sell_rate: 1.3,
        rate_modifier: 0.03,
        shop_buy_rate: 0.4,
        stock: [
            [ 'rs:pot', 5 ],
            [ 'rs:jug', 2 ],
            [ 'rs:shears', 2 ],
            [ 'rs:bucket', 3 ],
            [ 'rs:cake_tin', 2 ],
            [ 'rs:tinderbox', 2 ],
            [ 'rs:chisel', 2 ],
            [ 'rs:spade', 5 ],
            [ 'rs:hammer', 5 ],
        ]

    }

    const shopname = 'rs:test_general_store';
    let shop: Shop;
    let world;

    beforeAll(async () => {
        world = await setupConfig();
    })

    beforeEach(() => {
        shop = shopFactory(shopname, shopConfig);
    })

    describe('shop object', () => {
        test('shop should exist', () => {
            expect(shop?.key).toEqual(shopname);
        })
        test('shop stock should be correct', () => {
            expect(shopConfig.stock.reduce((all, curr) => all && shop.isItemSoldHere(curr[0]), true)).toBeTruthy()
            expect(shop.isItemSoldHere('rs:salmon')).toBeFalsy()
        })
        test('shop should buy at correct value', () => {
            const spadeItem = findItem('rs:spade');
            const shopSpade = shop.container.items[shop.container.findIndex(spadeItem.gameId)];
            expect(shop.getBuyPrice(spadeItem)).toBe(Math.round(spadeItem.value * shopConfig.shop_buy_rate))
            expect(shop.getBuyPrice(spadeItem)).toBe(1)
            expect(shopSpade.amount).toBe(5)
            shopSpade.amount += 1;
            expect(shopSpade.amount).toBe(6)
            expect(shop.getBuyPrice(spadeItem)).toBe(1)


            console.log(shop.getBuyPrice(spadeItem));

        })
        test('shop should sell at correct value', () => {

            const spadeItem = findItem('rs:spade');
            const shopSpade = shop.container.items[shop.container.findIndex(spadeItem.gameId)];

            // shopSpade.amount = 2;


            expect(shopSpade.amount).toBe(5)
            expect(shop.getSellPrice(spadeItem)).toBe(3)
            shopSpade.amount = 4;
            expect(shopSpade.amount).toBe(4)
            expect(shop.getSellPrice(spadeItem)).toBe(3)

            shopSpade.amount = 2;
            expect(shopSpade.amount).toBe(2)
            expect(shop.getSellPrice(spadeItem)).toBe(4)

            shopSpade.amount = 16;
            expect(shopSpade.amount).toBe(16)
            expect(shop.getSellPrice(spadeItem)).toBe(2)

            shopSpade.amount = 3;
            expect(shopSpade.amount).toBe(3)
            expect(shop.getSellPrice(spadeItem)).toBe(4)
        })
    })
})
