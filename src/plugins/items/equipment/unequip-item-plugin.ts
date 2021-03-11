import { itemInteractionActionHandler } from '@engine/world/action/item-interaction.action';
import { getItemFromContainer } from '@engine/world/items/item-container';
import { widgets } from '@engine/config';

export const action: itemInteractionActionHandler = (details) => {
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
