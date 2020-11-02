import { widgets } from '@server/world/config/widget';
import { itemAction } from '@server/world/action/item-action';
import { equipmentSlotIndex } from '@server/world/config/item-data';
import { getItemFromContainer } from '@server/world/items/item-container';

export const action: itemAction = (details) => {
    const { player, itemId, itemSlot, itemDetails } = details;

    const equipment = player.equipment;
    const item = getItemFromContainer(itemId, itemSlot, equipment);

    if(!item) {
        // The specified item was not found in the specified slot.
        return;
    }

    const equipmentSlot = equipmentSlotIndex(itemDetails.equipment.slot);
    player.unequipItem(equipmentSlot);
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
