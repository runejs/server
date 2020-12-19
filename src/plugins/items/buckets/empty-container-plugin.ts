import { itemAction } from '@server/world/action/item-action';
import { soundIds } from '@server/world/config/sound-ids';
import { itemIds } from '@server/world/config/item-ids';
import { getItemFromContainer } from '@server/world/items/item-container';
import { widgets } from '@server/config';

export const action: itemAction = (details) => {
    const { player, itemId, itemSlot } = details;

    const inventory = player.inventory;
    const item = getItemFromContainer(itemId, itemSlot, inventory);

    if(!item) {
        // The specified item was not found in the specified slot.
        return;
    }

    inventory.remove(itemSlot);
    player.playSound(soundIds.emptyBucket, 5);
    switch (itemId) {
        case itemIds.jugOfWater:
            player.giveItem(itemIds.jug);
            break;
        default:
            player.giveItem(itemIds.bucket);
            break;
    }

    // @TODO only update necessary slots
    player.outgoingPackets.sendUpdateAllWidgetItems(widgets.inventory, inventory);
};

export default {
    type: 'item_action',
    widgets: widgets.inventory,
    options: 'empty',
    itemIds: [itemIds.bucketOfMilk, itemIds.bucketOfWater, itemIds.jugOfWater],
    action,
    cancelOtherActions: false
};
