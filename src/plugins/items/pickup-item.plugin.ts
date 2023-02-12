import { ActionCancelType, spawnedItemInteractionHandler } from '@engine/action';
import { Item } from '@engine/world/items/item';
import { soundIds } from '@engine/world/config/sound-ids';
import { widgets } from '@engine/config/config-handler';
import { logger } from '@runejs/common';


export const handler: spawnedItemInteractionHandler = ({ player, worldItem, itemDetails }) => {
    const inventory = player.inventory;
    const amount = worldItem.amount;
    let slot = -1

    if(itemDetails.stackable) {
        const existingItemIndex = inventory.findIndex(worldItem.itemId);
        if(existingItemIndex !== -1) {
            const existingItem = inventory.items[existingItemIndex];
            if(existingItem && (existingItem.amount + worldItem.amount >= 2147483647)) {
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

    if (!worldItem.instance) {
        logger.error(`World item ${worldItem.itemId} has no instance`);
        return;
    }

    worldItem.instance.despawnWorldItem(worldItem);

    const item: Item = {
        itemId: worldItem.itemId,
        amount
    };

    const addedItem = inventory.add(item);

    if (!addedItem) {
        logger.error(`Failed to add item ${item.itemId} to inventory for player ${player.username}`);
        return;
    }

    player.outgoingPackets.sendUpdateSingleWidgetItem(widgets.inventory, addedItem.slot, addedItem.item);
    player.playSound(soundIds.pickupItem, 3);
    // (Jameskmonger) actionsCancelled is deprecated, casting this to satisfy the typecheck for now
    player.actionsCancelled.next(null as unknown as ActionCancelType);
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
