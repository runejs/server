import { Player } from '../player';
import { widgetIds } from '../widget';

export const swapItemAction = (player: Player, fromSlot: number, toSlot: number, widget: { widgetId: number, containerId: number }) => {
    if(widget.widgetId === widgetIds.inventory.widgetId && widget.containerId === widgetIds.inventory.containerId) {
        const inventory = player.inventory;

        if(toSlot > inventory.size - 1 || fromSlot > inventory.size - 1) {
            return;
        }

        inventory.swap(fromSlot, toSlot);
    }
};
