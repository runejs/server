import { widgets } from '@server/world/config/widget';
import { itemAction } from '@server/world/actor/player/action/item-action';
import { equipmentSlotIndex } from '@server/world/config/item-data';

export const action: itemAction = (details) => {
    const { player, itemId, itemSlot, itemDetails } = details;

    const equipmentSlot = equipmentSlotIndex(itemDetails.equipment.slot);
    player.equipItem(itemId, itemSlot, equipmentSlot);
};

export default {
    type: 'item_action',
    widgets: widgets.inventory,
    options: 'equip',
    action,
    cancelOtherActions: false
};
