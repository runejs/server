import { logger } from '@runejs/logger/dist/logger';
import { JSON_SCHEMA, safeLoad } from 'js-yaml';
import { readFileSync } from 'fs';

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

export function parseShops(): Shop[] {
    try {
        logger.info('Parsing shops...');

        const shops = safeLoad(readFileSync('data/config/shops.yaml', 'utf8'), { schema: JSON_SCHEMA }) as Shop[];

        if(!shops || shops.length === 0) {
            throw 'Unable to read shops.';
        }

        logger.info(`${shops.length} shops found.`);

        return shops;
    } catch(error) {
        logger.error('Error parsing shops: ' + error);
        return null;
    }
}