import { setupConfig } from '@server/game';
import { Shop, ShopConfiguration, shopFactory } from '@engine/config/shop-config';
import { findItem, findShop, widgets } from '@engine/config/config-handler';

describe('shopping', () => {

    const shopConfig: ShopConfiguration = {
        name: 'Test Shop',
        general_store: false,
        shop_sell_rate: 1.0,
        shop_buy_rate: 0.55,
        rate_modifier: 0.02,
        stock: [
            {
                itemKey: 'rs:battlestaff',
                amount: 5,
                restock: 100
            },
            {
                itemKey: 'rs:staff',
                amount: 5,
                restock: 100
            },
            {
                itemKey: 'rs:magic_staff',
                amount: 5,
                restock: 200
            },
            {
                itemKey: 'rs:staff_of_air',
                amount: 2,
                restock: 1000
            },
            {
                itemKey: 'rs:staff_of_water',
                amount: 2,
                restock: 1000
            },
            {
                itemKey: 'rs:staff_of_earth',
                amount: 2,
                restock: 1000
            },
            {
                itemKey: 'rs:staff_of_fire',
                amount: 2,
                restock: 1000
            }
        ]

    }

    const shopname = 'rs:test_shop';
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
            expect(shopConfig.stock.reduce((all, curr) => all && shop.isItemSoldHere(curr.itemKey), true)).toBeTruthy()
            expect(shop.isItemSoldHere('rs:salmon')).toBeFalsy()
        })
        test('player should buy item from shop at correct value', () => { // Player purchases, shop sells

            console.log(shop.container.items.map(a => a?.itemId))

            const battleStaffItem = findItem('rs:battlestaff');
            if (!battleStaffItem) {
                throw new Error('battleStaffItem not found in server config');
            }
            const shopBStaffIndex = shop.container.findIndex(battleStaffItem.gameId);
            const shopBstaff = shop.container.items[shopBStaffIndex];
            if (!shopBstaff) {
                throw new Error('Battle staff item not found in shop config');
            }
            expect(shop.getBuyPrice(battleStaffItem)).toBe(Math.round(battleStaffItem.value * (shopConfig.shop_sell_rate || 1.00)))
            expect(shop.getBuyPrice(battleStaffItem)).toBe(7000) // BStaff standard price
            expect(shopBstaff.amount).toBe(5)
            shopBstaff.amount += 1;
            expect(shopBstaff.amount).toBe(6)
            expect(shop.getBuyPrice(battleStaffItem)).toBe(6860);
            shopBstaff.amount -= 3;
            expect(shopBstaff.amount).toBe(3)
            expect(shop.getBuyPrice(battleStaffItem)).toBe(7280);


        })
        test('shop should sell at correct value', () => { // Player sells, shop pays

            const battleStaffItem = findItem('rs:battlestaff');
            if (!battleStaffItem) {
                throw new Error('battleStaffItem not found in server config');
            }
            const shopBStaffIndex = shop.container.findIndex(battleStaffItem.gameId);
            const shopBstaff = shop.container.items[shopBStaffIndex];
            if (!shopBstaff) {
                throw new Error('Battle staff item not found in shop config');
            }

            // shopSpade.amount = 2;


            expect(shopBstaff.amount).toBe(5)
            expect(shop.getSellPrice(battleStaffItem)).toBe(3850)
            shopBstaff.amount = 4;
            expect(shopBstaff.amount).toBe(4)
            expect(shop.getSellPrice(battleStaffItem)).toBe(3990)

            shopBstaff.amount = 1;
            expect(shopBstaff.amount).toBe(1)
            expect(shop.getSellPrice(battleStaffItem)).toBe(4410)

            shopBstaff.amount = 16;
            expect(shopBstaff.amount).toBe(16)
            expect(shop.getSellPrice(battleStaffItem)).toBe(2310)

            shopBstaff.amount = 3;
            expect(shopBstaff.amount).toBe(3)
            expect(shop.getSellPrice(battleStaffItem)).toBe(4130)
        })
    })
})
