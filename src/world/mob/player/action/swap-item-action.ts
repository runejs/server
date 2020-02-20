import { Player } from '../player';
import { widgetIds } from '../widget';

export const swapItemAction = (player: Player, fromSlot: number, toSlot: number, widgetId: number) => {
    if(widgetId === widgetIds.inventory) {
        const inventory = player.inventory;

        if(toSlot > inventory.size - 1 || fromSlot > inventory.size - 1) {
            return;
        }

        inventory.swap(fromSlot, toSlot);
    }
};
