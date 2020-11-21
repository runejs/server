import { widgets } from '@server/world/config/widget';
import { itemAction } from '@server/world/action/item-action';
import { soundIds } from '@server/world/config/sound-ids';
import { getItemFromContainer } from '@server/world/items/item-container';
import { serverConfig } from '@server/game-server';
import { Rights } from '@server/world/actor/player/player';

export const action: itemAction = ({ player, itemId, itemSlot }) => {
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
    player.instance.spawnWorldItem(item, player.position, player, 300);
    player.actionsCancelled.next();
};

export default {
    type: 'item_action',
    widgets: widgets.inventory,
    options: 'drop',
    action,
    cancelOtherActions: false
};
