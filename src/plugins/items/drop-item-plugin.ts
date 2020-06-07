import { ActionType, RunePlugin } from '@server/plugins/plugin';
import { widgets } from '@server/world/config/widget';
import { getItemFromContainer, itemAction } from '@server/world/actor/player/action/item-action';
import { world } from '@server/game-server';
import { soundIds } from '@server/world/config/sound-ids';

export const action: itemAction = (details) => {
    const { player, itemId, itemSlot } = details;

    const inventory = player.inventory;
    const item = getItemFromContainer(itemId, itemSlot, inventory);

    if(!item) {
        // The specified item was not found in the specified slot.
        return;
    }

    inventory.remove(itemSlot);
    player.outgoingPackets.sendUpdateSingleWidgetItem(widgets.inventory, itemSlot, null);
    player.playSound(soundIds.dropItem, 5);
    world.spawnWorldItem(item, player.position, player, 300);
    player.actionsCancelled.next();
};

export default new RunePlugin({
    type: ActionType.ITEM_ACTION,
    widgets: widgets.inventory,
    options: 'drop',
    action,
    cancelOtherActions: false
});
