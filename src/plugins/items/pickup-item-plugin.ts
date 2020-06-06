import { ActionType, RunePlugin } from '@server/plugins/plugin';
import { worldItemAction } from '@server/world/actor/player/action/world-item-action';
import { world } from '../../game-server';
import { Item } from '../../world/items/item';
import { widgets } from '../../world/config/widget';
import { soundIds } from '@server/world/config/sound-ids';

export const action: worldItemAction = (details) => {
    const { player, worldItem } = details;

    const inventory = player.inventory;
    let slot = -1;
    const itemData = world.itemData.get(worldItem.itemId);
    let amount = worldItem.amount;

    if(itemData.stackable) {
        const existingItemIndex = inventory.findIndex(worldItem.itemId);
        if(existingItemIndex !== -1) {
            const existingItem = inventory.items[existingItemIndex];
            if(existingItem.amount + worldItem.amount < 2147483647) {
                existingItem.amount += worldItem.amount;
                amount += existingItem.amount;
                slot = existingItemIndex;
            }
        }
    }

    if(slot === -1) {
        slot = inventory.getFirstOpenSlot();
    }

    if(slot === -1) {
        player.sendMessage(`You don't have enough free space to do that.`);
        return;
    }

    world.removeWorldItem(worldItem);

    const item: Item = {
        itemId: worldItem.itemId,
        amount
    };

    inventory.add(item);
    player.outgoingPackets.sendUpdateSingleWidgetItem(widgets.inventory, slot, item);
    player.playSound(soundIds.pickupItem, 3);
    player.actionsCancelled.next();
};

export default new RunePlugin({
    type: ActionType.WORLD_ITEM_ACTION,
    options: 'pick-up',
    action,
    walkTo: true
});
