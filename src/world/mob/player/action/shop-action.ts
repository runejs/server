import { world } from '@server/game-server';
import { Player } from '@server/world/mob/player/player';
import { logger } from '@runejs/logger/dist/logger';
import { Shop } from '@server/world/config/shops';

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

        player.packetSender.showWidgetAndSidebar(3824, 3822);
        for(let i = 0; i < player.inventory.items.length; i++) {
            if(player.inventory.items[i] !== null) {
                player.packetSender.sendUpdateSingleWidgetItem(3823, i, {
                    itemId: player.inventory.items[i].itemId, amount: player.inventory.items[i].amount
                });
            }
        }



    } catch (error) {
        logger.error(`Error opening shop ${identification}: ` + error);
    }

}