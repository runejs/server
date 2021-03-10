import { itemActionHandler } from '@engine/world/action/item.action';
import { widgets } from '@engine/config';

export const action: itemActionHandler = (details) => {
    const { player, itemId, itemSlot, itemDetails } = details;

    if(!itemDetails) {
        // The item is not yet configured on the server.
        player.sendMessage(`Item ${itemId} is not yet configured on the server.`);
        return;
    }

    player.equipItem(itemId, itemSlot, itemDetails.equipmentData?.equipmentSlot);
};

export default {
    type: 'item_action',
    widgets: widgets.inventory,
    options: 'equip',
    action,
    cancelOtherActions: false
};
