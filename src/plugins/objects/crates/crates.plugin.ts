import { findItem, widgets } from '@engine/config';
import { objectInteractionActionHandler } from '@engine/world/action/object-interaction.action';
import { World } from '@engine/world';
import { itemIds } from '@engine/world/config/item-ids';
import { LandscapeObject } from '@runejs/filestore';

export const action: objectInteractionActionHandler = (details) => {
    const veggies = [itemIds.onion, itemIds.grain, itemIds.cabbage];
    details.player.busy = true;
    details.player.playAnimation(827);
    
    const random = Math.floor(Math.random() * 3);  
    const pickedItem = findItem(veggies[random]);
    
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
            objectIds: [ 366, 357, 355 ],
            options: ['loot', 'search', 'examine' ],
            walkTo: true,
            handler: action
        }
    ]
};
