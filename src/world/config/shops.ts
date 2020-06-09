import { logger } from '@runejs/logger';
import { JSON_SCHEMA, safeLoad } from 'js-yaml';
import { readFileSync } from 'fs';
import { ItemContainer } from '@server/world/items/item-container';

export interface Shop {
    identification: string;
    name: string;
    interfaceId: number;
    items: ShopItems[];
}

interface ShopItems {
    id: number;
    name: string;
    amountInStock: number;
    price: number;
}

export function shopItemContainer(shop: Shop): ItemContainer {
    const shopContainer = new ItemContainer(40);
    shop.items.forEach((item, i) => shopContainer.set(i, !item ? null : { itemId: item.id, amount: item.amountInStock }, false));
    return shopContainer;
}

export function parseShops(): Shop[] {
    try {
        logger.info('Parsing shops...');

        const shops = safeLoad(readFileSync('data/config/shops.yaml', 'utf8'), { schema: JSON_SCHEMA }) as Shop[];

        if(!shops || shops.length === 0) {
            throw new Error('Unable to read shops.');
        }

        logger.info(`${shops.length} shops found.`);

        return shops;
    } catch(error) {
        logger.error('Error parsing shops: ' + error);
        return null;
    }
}
