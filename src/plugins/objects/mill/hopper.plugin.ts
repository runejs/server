import { World } from '@engine/world';
import { itemIds } from '@engine/world/config/item-ids';
import { itemOnObjectActionHandler } from '@engine/world/action/item-on-object.action';


export const action: itemOnObjectActionHandler = (details) => {
    if ((details.player.savedMetadata['mill-grain'] && details.player.savedMetadata['mill-grain'] === 1)) {
        details.player.sendMessage(`There is already grain in the hopper.`);
        return;
    }
    details.player.busy = true;
    details.player.playAnimation(3572);
    details.player.playSound(2576, 5);

    setTimeout(() => {
        details.player.removeFirstItem(itemIds.grain);
        details.player.sendMessage(`You put the grain in the hopper. You should now pull the lever nearby to operate`);
        details.player.sendMessage(`the hopper.`);
        details.player.savedMetadata['mill-grain'] = 1;
        details.player.busy = false;
    }, World.TICK_LENGTH);

};

export default {
    pluginId: 'rs:grain_hopper',
    hooks: [
        {
            type: 'item_on_object',
            objectIds: [ 2714, 2717 ],
            itemIds: [ itemIds.grain ],
            walkTo: true,
            handler: action
        }
    ]
};
