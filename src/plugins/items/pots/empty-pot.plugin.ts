import { itemInteractionActionHandler } from '@engine/world/action/item-interaction.action';
import { soundIds } from '@engine/world/config/sound-ids';
import { itemIds } from '@engine/world/config/item-ids';
import { getItemFromContainer } from '@engine/world/items/item-container';
import { widgets } from '@engine/config/config-handler';

export const action: itemInteractionActionHandler = (details) => {
    const { player, itemId, itemSlot } = details;

    const inventory = player.inventory;
    const item = getItemFromContainer(itemId, itemSlot, inventory);

    if (!item) {
        // The specified item was not found in the specified slot.
        return;
    }

    inventory.remove(itemSlot);
    player.playSound(soundIds.potContentModified, 5);
    player.giveItem(itemIds.pot);
};

export default {
    pluginId: 'rs:empty_pot',
    hooks: [
        {
            type: 'item_interaction',
            widgets: widgets.inventory,
            options: 'empty',
            itemIds: [ itemIds.potOfFlour ],
            handler: action,
            cancelOtherActions: false
        }
    ]
};
