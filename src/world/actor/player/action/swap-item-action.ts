import { Player } from '../player';
import { widgets } from '../../../config/widget';
import { logger } from '@runejs/logger/dist/logger';

export const swapItemAction = (player: Player, fromSlot: number, toSlot: number, widget: { widgetId: number, containerId: number }) => {
    if (widget.widgetId === widgets.inventory.widgetId && widget.containerId === widgets.inventory.containerId) {
        const inventory = player.inventory;

        if (toSlot > inventory.size - 1 || fromSlot > inventory.size - 1) {
            return;
        }

        inventory.swap(fromSlot, toSlot);
    }
    if (widget.widgetId === widgets.bank.screenWidget.widgetId && widget.containerId === widgets.bank.screenWidget.containerId) {
        const bank = player.bank;

        if (toSlot > bank.size - 1 || fromSlot > bank.size - 1) {
            return;
        }

        bank.swap(fromSlot, toSlot);
    }
};


export const insertItemAction = (player: Player, fromSlot: number, toSlot: number, widget: { widgetId: number, containerId: number }) => {
    if (widget.widgetId === widgets.bank.screenWidget.widgetId && widget.containerId === widgets.bank.screenWidget.containerId) {
        const bank = player.bank;

        if (toSlot > bank.size - 1 || fromSlot > bank.size - 1) {
            return;
        }
        if (fromSlot < toSlot) {
            let slot = toSlot;
            let current = bank.remove(fromSlot);
            while (slot >= fromSlot) {
                const temp = bank.remove(slot);
                bank.set(slot, current);
                current = temp;
                slot--;
            }
        } else {
            let slot = toSlot;
            let current = bank.remove(fromSlot);
            while (slot <= fromSlot) {
                const temp = bank.remove(slot);
                bank.set(slot, current);
                current = temp;
                slot++;
            }
        }
        player.outgoingPackets.sendUpdateAllWidgetItems(widgets.bank.screenWidget, player.bank);

    }
};
