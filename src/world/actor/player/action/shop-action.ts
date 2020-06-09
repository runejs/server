import { world } from '@server/game-server';
import { Player } from '@server/world/actor/player/player';
import { logger } from '@runejs/logger';
import { Shop, shopItemContainer } from '@server/world/config/shops';
import { widgets } from '@server/world/config/widget';

function findShop(identification: string): Shop {
    return world.shops.find(shop => shop.identification === identification);
}

export function openShop(player: Player, identification: string, closeOnWalk: boolean = true): void {
    if(player.busy) {
        return;
    }

    const openedShop = findShop(identification);
    if(!openedShop) {
        logger.error(`Unable to find the shop with identification of: ${identification}`);
        return;
    }

    const shopContainer = shopItemContainer(openedShop);

    player.metadata['lastOpenedShop'] = openedShop;
    player.outgoingPackets.updateWidgetString(widgets.shop.widgetId, widgets.shop.title, openedShop.name);
    player.outgoingPackets.sendUpdateAllWidgetItems(widgets.shop, shopContainer);
    player.outgoingPackets.sendUpdateAllWidgetItems(widgets.shopPlayerInventory, player.inventory);

    player.activeWidget = {
        widgetId: widgets.shop.widgetId,
        secondaryWidgetId: widgets.shopPlayerInventory.widgetId,
        type: 'SCREEN_AND_TAB',
        closeOnWalk: closeOnWalk
    };
}
