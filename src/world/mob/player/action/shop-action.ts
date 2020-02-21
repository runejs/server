import { world } from '@server/game-server';
import { Player } from '@server/world/mob/player/player';
import { logger } from '@runejs/logger/dist/logger';
import { Shop } from '@server/world/config/shops';
import { widgetIds } from '@server/world/mob/player/widget';

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
        player.packetSender.updateWidgetString(widgetIds.shop.shop_name, openedShop.name);
        for(let i = 0; i < 30; i++) {
            if(openedShop.items.length <= i) {
                player.packetSender.sendUpdateSingleWidgetItem(widgetIds.shop.shop_container, i, null);
            } else {
                player.packetSender.sendUpdateSingleWidgetItem(widgetIds.shop.shop_container, i, {
                    itemId: openedShop.items[i].id, amount: openedShop.items[i].amountInStock
                });
            }
        }
        for(let i = 0; i < openedShop.items.length; i++) {
            player.packetSender.sendUpdateSingleWidgetItem(widgetIds.shop.shop_container, i, {
                itemId: openedShop.items[i].id, amount: openedShop.items[i].amountInStock
            });
        }
        player.activeWidget = {
            widgetId: 3824,
            type: 'SCREEN',
            closeOnWalk: closeOnWalk
        };

        player.packetSender.sendUpdateAllWidgetItems(widgetIds.inventory, player.inventory);
        player.packetSender.showWidgetAndSidebar(widgetIds.shop.shop_window, widgetIds.shop.inventory_sidebar);
        for(let i = 0; i < player.inventory.items.length; i++) {
            if(player.inventory.items[i] !== null) {
                player.packetSender.sendUpdateSingleWidgetItem(widgetIds.shop.inventory_container, i, {
                    itemId: player.inventory.items[i].itemId, amount: player.inventory.items[i].amount
                });
            } else {
                player.packetSender.sendUpdateSingleWidgetItem(widgetIds.shop.inventory_container, i, null);
            }
        }



    } catch (error) {
        logger.error(`Error opening shop ${identification}: ` + error);
    }

}