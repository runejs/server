import { swapItemsAction } from '@server/world/action/swap-items-action';
import { ItemContainer } from '@server/world/items/item-container';
import { Player } from '@server/world/actor/player/player';
import { gameInterfaces } from '@server/config';

type WidgetDetail = [ number, number, (player: Player) => ItemContainer ];

const swappableWidgets: WidgetDetail[] = [
    // Player Inventory
    [ gameInterfaces.inventory.widgetId, gameInterfaces.inventory.containerId, player => player.inventory ],
    // Player Bank Screen
    [ gameInterfaces.bank.screenWidget.widgetId, gameInterfaces.bank.screenWidget.containerId, player => player.bank ]
];

function swapItems(container: ItemContainer, fromSlot: number, toSlot: number): void {
    if(toSlot > container.size - 1 || fromSlot > container.size - 1) {
        return;
    }

    container.swap(fromSlot, toSlot);
}

export const action: swapItemsAction = (details) => {
    const { player, widgetId, containerId, fromSlot, toSlot } = details;

    const widgetDetails = swappableWidgets.filter(widgetDetail => widgetDetail[0] === widgetId && widgetDetail[1] === containerId);
    if(widgetDetails && widgetDetails[0]) {
        const itemContainer: ItemContainer = widgetDetails[0][2](player);
        swapItems(itemContainer, fromSlot, toSlot);
    }
};

export default {
    type: 'swap_items',
    widgetIds: swappableWidgets.map(widgetDetails => widgetDetails[0]),
    action
};
