import { Player } from '../player';
import { widgets } from '../../../config/widget';

export const swapItemAction = (player: Player, fromSlot: number, toSlot: number, widget: { widgetId: number, containerId: number }) => {
    if(widget.widgetId === widgets.inventory.widgetId && widget.containerId === widgets.inventory.containerId) {
        const inventory = player.inventory;

        if(toSlot > inventory.size - 1 || fromSlot > inventory.size - 1) {
            return;
        }

        inventory.swap(fromSlot, toSlot);
    }
};
