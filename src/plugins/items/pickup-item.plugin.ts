import { spawnedItemInteractionHandler } from '@engine/world/action/spawned-item-interaction.action';
import { Item } from '@engine/world/items/item';
import { soundIds } from '@engine/world/config/sound-ids';
import { widgets } from '@engine/config';


export const handler: spawnedItemInteractionHandler = ({ player, worldItem, itemDetails }) => {
    const inventory = player.inventory;
    const amount = worldItem.amount;
    let slot = -1

    if(itemDetails.stackable) {
        const existingItemIndex = inventory.findIndex(worldItem.itemId);
        if(existingItemIndex !== -1) {
            const existingItem = inventory.items[existingItemIndex];
            if(existingItem.amount + worldItem.amount >= 2147483647) {
                // @TODO create new item stack
                return;
            } else {
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

    worldItem.instance.despawnWorldItem(worldItem);

    const item: Item = {
        itemId: worldItem.itemId,
        amount
    };

    const addedItem = inventory.add(item);
    player.outgoingPackets.sendUpdateSingleWidgetItem(widgets.inventory, addedItem.slot, addedItem.item);
    player.playSound(soundIds.pickupItem, 3);
    player.actionsCancelled.next(null);
};

export default {
    pluginId: 'rs:pickup_item',
    hooks: [
        {
            type: 'spawned_item_interaction',
            options: 'pick-up',
            handler,
            walkTo: true
        }
    ]
};
