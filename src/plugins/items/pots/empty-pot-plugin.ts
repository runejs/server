import { getItemFromContainer, itemAction } from '@server/world/actor/player/action/item-action';
import { widgets } from '@server/world/config/widget';
import { soundIds } from '@server/world/config/sound-ids';
import { ActionType, RunePlugin } from '@server/plugins/plugin';
import { itemIds } from '@server/world/config/item-ids';

export const action: itemAction = (details) => {
    const {player, itemId, itemSlot} = details;

    const inventory = player.inventory;
    const item = getItemFromContainer(itemId, itemSlot, inventory);

    if (!item) {
        // The specified item was not found in the specified slot.
        return;
    }

    inventory.remove(itemSlot);
    player.outgoingPackets.playSound(soundIds.potContentModified, 5);
    player.giveItem(itemIds.pot);
};

export default new RunePlugin({
    type: ActionType.ITEM_ACTION,
    widgets: widgets.inventory,
    options: 'empty',
    itemIds: [itemIds.potOfFlour],
    action,
    cancelOtherActions: false
});