import { findItem, widgets } from '@engine/config/config-handler';
import { ItemDetails } from '@engine/config/item-config';
import { Rights } from '@engine/world/actor/player/player';
import { ItemOnItemAction } from '@engine/action/pipe/item-on-item.action';
import { WidgetInteractionAction } from '@engine/action/pipe/widget-interaction.action';

/**
 * The rotten potato item.
 *
 * (Jameskmonger) I have put ! after findItem() because we know the item exists.
 */
export const RottenPotatoItem: ItemDetails = findItem('rs:rotten_potato')!;


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
