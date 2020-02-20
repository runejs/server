import { logger } from '@runejs/logger/dist/logger';
import { JSON_SCHEMA, safeLoad } from 'js-yaml';
import { readFileSync } from 'fs';
import { world } from '@server/game-server';
import { Player } from '@server/world/mob/player/player';

export enum ShopName {

}
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

function findShop(identification: string): Shop {
    for(let i = 0; i <= world.shops.length; i++) {
        if(world.shops[i].identification === identification) return world.shops[i];
    }
    return undefined;
}

export function openShop(player: Player, identification: string, closeOnWalk: boolean = true): void {
    try {
        const openedShop = findShop(identification);
        if(openedShop === undefined) {
            throw `Unable to find the shop with identification of: ${identification}`;
        }
        player.packetSender.updateWidgetString(3901, openedShop.name);
        for(let i = 0; i < 30; i++) {
            if(openedShop.items.length <= i) {
                player.packetSender.sendUpdateSingleWidgetItem(3900, i, null);
            } else {
                player.packetSender.sendUpdateSingleWidgetItem(3900, i, {
                    itemId: openedShop.items[i].id, amount: openedShop.items[i].amountInStock
                });
            }
        }
        for(let i = 0; i < openedShop.items.length; i++) {
            player.packetSender.sendUpdateSingleWidgetItem(3900, i, {
                itemId: openedShop.items[i].id, amount: openedShop.items[i].amountInStock
            });
        }
        player.activeWidget = {
            widgetId: 3824,
            type: 'SCREEN',
            closeOnWalk: closeOnWalk
        };
    } catch (error) {
        logger.error(`Error opening shop ${identification}: ` + error);
    }

}