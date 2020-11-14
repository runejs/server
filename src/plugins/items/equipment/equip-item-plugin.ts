import { widgets } from '@server/world/config/widget';
import { itemAction } from '@server/world/action/item-action';

export const action: itemAction = (details) => {
    const { player, itemId, itemSlot, itemDetails } = details;
    player.equipItem(itemId, itemSlot, itemDetails.equipmentData?.equipmentSlot);
};

export default {
    type: 'item_action',
    widgets: widgets.inventory,
    options: 'equip',
    action,
    cancelOtherActions: false
};
