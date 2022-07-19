import { itemSwapActionHandler } from '@engine/action';
import { ItemContainer } from '@engine/world/items/item-container';
import { Player } from '@engine/world/actor/player/player';
import { widgets } from '@engine/config/config-handler';

type WidgetDetail = [ number, number, (player: Player) => ItemContainer ];

const movableWidgets: WidgetDetail[] = [
    // Player Bank Screen
    [ widgets.bank.screenWidget.widgetId, widgets.bank.screenWidget.containerId, player => player.bank ]
];

function moveItem(player: Player, container: ItemContainer, widget: { widgetId: number, containerId: number },
    fromSlot: number, toSlot: number): void {
    if(toSlot > container.size - 1 || fromSlot > container.size - 1) {
        return;
    }

    if(fromSlot < toSlot) {
        let slot = toSlot;
        let current = container.remove(fromSlot);
        while(slot >= fromSlot) {
            const temp = container.remove(slot);
            container.set(slot, current);
            current = temp;
            slot--;
        }
    } else {
        let slot = toSlot;
        let current = container.remove(fromSlot);
        while(slot <= fromSlot) {
            const temp = container.remove(slot);
            container.set(slot, current);
            current = temp;
            slot++;
        }
    }

    player.outgoingPackets.sendUpdateAllWidgetItems(widget, container);
}

export const action: itemSwapActionHandler = (details) => {
    const { player, widgetId, containerId, fromSlot, toSlot } = details;

    const widgetDetails = movableWidgets.filter(widgetDetail => widgetDetail[0] === widgetId && widgetDetail[1] === containerId);
    if(widgetDetails && widgetDetails[0]) {
        const itemContainer: ItemContainer = widgetDetails[0][2](player);
        moveItem(player, itemContainer, { widgetId, containerId }, fromSlot, toSlot);
    }
};

export default {
    pluginId: 'rs:move_item',
    hooks: [
        {
            type: 'move_item',
            widgetIds: movableWidgets.map(widgetDetails => widgetDetails[0]),
            handler: action
        }
    ]
};
