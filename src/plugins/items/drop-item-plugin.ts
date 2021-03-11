import { itemInteractionActionHandler } from '@engine/world/action/item-interaction.action';
import { soundIds } from '@engine/world/config/sound-ids';
import { getItemFromContainer } from '@engine/world/items/item-container';
import { serverConfig } from '@engine/game-server';
import { Rights } from '@engine/world/actor/player/player';
import { widgets } from '@engine/config';

export const action: itemInteractionActionHandler = ({ player, itemId, itemSlot }) => {
    const inventory = player.inventory;
    const item = getItemFromContainer(itemId, itemSlot, inventory);

    if(!item) {
        // The specified item was not found in the specified slot.
        return;
    }

    if(!serverConfig.adminDropsEnabled && player.rights === Rights.ADMIN) {
        player.sendMessage('Administrators are not allowed to drop items.', true);
        return;
    }

    inventory.remove(itemSlot);
    player.outgoingPackets.sendUpdateSingleWidgetItem(widgets.inventory, itemSlot, null);
    player.playSound(soundIds.dropItem, 5);
    player.instance.spawnWorldItem(item, player.position, { owner: player, expires: 300 });
    player.actionsCancelled.next(null);
};

export default {
    type: 'item_action',
    widgets: widgets.inventory,
    options: 'drop',
    handler: action,
    cancelOtherActions: false
};
