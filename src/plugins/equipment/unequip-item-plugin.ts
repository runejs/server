import { widgets } from '@server/world/config/widget';
import { getItemFromContainer, itemAction } from '@server/world/action/item-action';
import { equipmentSlotIndex } from '@server/world/config/item-data';

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
