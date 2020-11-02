import { World } from '@server/world';
import { itemIds } from '@server/world/config/item-ids';
import { itemOnObjectAction } from '@server/world/action/item-on-object-action';


export const action: itemOnObjectAction = (details) => {
    if ((details.player.metadata['grain'] && details.player.metadata['grain'] === 1)) {
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
        details.player.metadata['grain'] = 1;
        details.player.busy = false;
    }, World.TICK_LENGTH);

};

export default {
    type: 'item_on_object',
    objectIds: [2714],
    itemIds: [itemIds.grain],
    walkTo: true,
    action
};
