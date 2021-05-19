import { findItem, widgets } from '@engine/config';
import { ItemDetails } from '@engine/config/item-config';
import { Rights } from '@engine/world/actor/player/player';
import { ItemOnItemAction } from '@engine/world/action/item-on-item.action';
import { WidgetInteractionAction } from '@engine/world/action/widget-interaction.action';

export const RottenPotatoItem: ItemDetails = findItem('rs:rotten_potato');


export const ExecuteIfAdmin = (details: ItemOnItemAction | WidgetInteractionAction, callback) => {
    if(details.player.rights === Rights.ADMIN) {
        callback(details);
        return;
    }
    while (details.player.inventory.has(RottenPotatoItem.gameId)) {
        details.player.inventory.removeFirst(RottenPotatoItem.gameId, false);
    }
    details.player.outgoingPackets.sendUpdateAllWidgetItems(widgets.inventory, details.player.inventory);

}
