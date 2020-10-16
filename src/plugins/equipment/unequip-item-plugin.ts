import { ActionType, RunePlugin } from '@server/plugins/plugin';
import { widgets } from '@server/world/config/widget';
import { getItemFromContainer, itemAction } from '@server/world/actor/player/action/item-action';
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

export default new RunePlugin({
    type: ActionType.ITEM_ACTION,
    widgets: [
        widgets.equipment,
        widgets.equipmentStats
    ],
    options: 'remove',
    action,
    cancelOtherActions: false
});
