import { itemInteractionActionHandler } from '@engine/action/pipe/item-interaction.action';
import { getItemFromContainer } from '@engine/world/items/item-container';
import { widgets } from '@engine/config/config-handler';

export const handler: itemInteractionActionHandler = (details) => {
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
    pluginId: 'rs:unequip_item',
    hooks: [
        {
            type: 'item_interaction',
            widgets: [
                widgets.equipment,
                widgets.equipmentStats
            ],
            options: 'remove',
            handler,
            cancelOtherActions: false
        }
    ]
};
