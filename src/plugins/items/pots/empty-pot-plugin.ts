import { itemAction } from '@server/world/action/item-action';
import { widgets } from '@server/world/config/widget';
import { soundIds } from '@server/world/config/sound-ids';
import { RunePlugin } from '@server/plugins/plugin';
import { itemIds } from '@server/world/config/item-ids';
import { getItemFromContainer } from '@server/world/items/item-container';
import { ActionType } from '@server/world/action';

export const action: itemAction = (details) => {
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
    type: 'item_action',
    widgets: widgets.inventory,
    options: 'empty',
    itemIds: [itemIds.potOfFlour],
    action,
    cancelOtherActions: false
};
