import { itemSwapActionHandler } from '@engine/action/pipe/item-swap.action';
import { ItemContainer } from '@engine/world/items/item-container';
import { Player } from '@engine/world/actor/player/player';
import { widgets } from '@engine/config/config-handler';

type WidgetDetail = [ number, number, (player: Player) => ItemContainer ];

const swappableWidgets: WidgetDetail[] = [
    // Player Inventory
    [ widgets.inventory.widgetId, widgets.inventory.containerId, player => player.inventory ],
    // Player Bank Screen
    [ widgets.bank.screenWidget.widgetId, widgets.bank.screenWidget.containerId, player => player.bank ]
];

function swapItems(container: ItemContainer, fromSlot: number, toSlot: number): void {
    if(toSlot > container.size - 1 || fromSlot > container.size - 1) {
        return;
    }

    container.swap(fromSlot, toSlot);
}

export const action: itemSwapActionHandler = (details) => {
    const { player, widgetId, containerId, fromSlot, toSlot } = details;

    const widgetDetails = swappableWidgets.filter(widgetDetail => widgetDetail[0] === widgetId && widgetDetail[1] === containerId);
    if(widgetDetails && widgetDetails[0]) {
        const itemContainer: ItemContainer = widgetDetails[0][2](player);
        swapItems(itemContainer, fromSlot, toSlot);
    }
};

export default {
    pluginId: 'rs:swap_items',
    hooks: [
        {
            type: 'item_swap',
            widgetIds: swappableWidgets.map(widgetDetails => widgetDetails[0]),
            handler: action
        }
    ]
};
