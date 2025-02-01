import type { objectInteractionActionHandler } from '@engine/action/pipe/object-interaction.action';
import { findItem, widgets } from '@engine/config/config-handler';
import { itemIds } from '@engine/world/config/item-ids';
import { World } from '@engine/world/world';

export const action: objectInteractionActionHandler = details => {
    const veggies = [itemIds.onion, itemIds.grain, itemIds.cabbage];
    details.player.busy = true;
    details.player.playAnimation(827);

    const random = Math.floor(Math.random() * veggies.length);
    const pickedItem = findItem(veggies[random])!;

    details.player.outgoingPackets.sendUpdateAllWidgetItems(widgets.inventory, details.player.inventory);

    setTimeout(() => {
        details.player.sendMessage(`You found a ${pickedItem.name.toLowerCase()} chest!.`);
        details.player.playSound(2581, 7);
        details.player.instance.hideGameObjectTemporarily(details.object, 60);
        details.player.giveItem(pickedItem.gameId);
        details.player.busy = false;
    }, World.TICK_LENGTH);
};

export default {
    pluginId: 'rs:crates',
    hooks: [
        {
            type: 'object_interaction',
            objectIds: [366, 357, 355],
            options: ['loot', 'search', 'examine'],
            walkTo: true,
            handler: action,
        },
    ],
};
