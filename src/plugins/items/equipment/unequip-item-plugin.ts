import { widgets } from '@server/world/config/widget';
import { itemAction } from '@server/world/action/item-action';
import { getItemFromContainer } from '@server/world/items/item-container';

export const action: itemAction = (details) => {
    const { player, itemId, itemSlot, itemDetails } = details;

    const equipment = player.equipment;
    const item = getItemFromContainer(itemId, itemSlot, equipment);

    if(!item) {
        // The specified item was not found in the specified slot.
        return;
    }

    if(!itemDetails) {
        // The item is not yet configured on the server.
        player.sendMessage(`Item ${itemId} is not yet configured on the server.`);
        return;
    }

    player.unequipItem(itemDetails.equipmentData?.equipmentSlot);
};

export default {
    type: 'item_action',
    widgets: [
        widgets.equipment,
        widgets.equipmentStats
    ],
    options: 'remove',
    action,
    cancelOtherActions: false
};
