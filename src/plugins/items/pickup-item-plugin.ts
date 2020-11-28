import { worldItemAction } from '@server/world/action/world-item-action';
import { Item } from '../../world/items/item';
import { soundIds } from '@server/world/config/sound-ids';
import { gameInterfaces } from '@server/config';

export const action: worldItemAction = ({ player, worldItem, itemDetails }) => {
    const inventory = player.inventory;
    let slot = -1;
    let amount = worldItem.amount;

    if(itemDetails.stackable) {
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

    player.instance.despawnWorldItem(worldItem);

    const item: Item = {
        itemId: worldItem.itemId,
        amount
    };

    inventory.add(item);
    player.outgoingPackets.sendUpdateSingleWidgetItem(gameInterfaces.inventory, slot, item);
    player.playSound(soundIds.pickupItem, 3);
    player.actionsCancelled.next();
};

export default {
    type: 'world_item_action',
    options: 'pick-up',
    action,
    walkTo: true
};
