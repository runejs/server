import { itemInteractionActionHandler } from '@engine/world/action/item-interaction.action';
import { widgets } from '@engine/config/config-handler';

export const handler: itemInteractionActionHandler = (details) => {
    const { player, itemId, itemSlot, itemDetails } = details;

    if(!itemDetails) {
        // The item is not yet configured on the server.
        player.sendMessage(`Item ${itemId} is not yet configured on the server.`);
        return;
    }

    player.equipItem(itemId, itemSlot, itemDetails.equipmentData?.equipmentSlot);
};

export default {
    pluginId: 'rs:equip_item',
    hooks: [
        {
            type: 'item_interaction',
            widgets: widgets.inventory,
            options: 'equip',
            handler,
            cancelOtherActions: false
        }
    ]
};
