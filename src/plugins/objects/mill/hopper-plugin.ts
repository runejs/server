import { World } from '@server/world/world';
import { ActionType, RunePlugin } from '@server/plugins/plugin';
import { itemIds } from '@server/world/config/item-ids';
import { itemOnObjectAction } from '@server/world/actor/player/action/item-on-object-action';


export const action: itemOnObjectAction = (details) => {
    if ((details.player.metadata['grain'] && details.player.metadata['grain'] === 1)) {
        details.player.outgoingPackets.chatboxMessage(`There is already grain in the hopper.`);
        return;
    }
    details.player.busy = true;
    details.player.playAnimation(3572);
    details.player.outgoingPackets.playSound(2576, 5);

    setTimeout(() => {
        details.player.removeFirstItem(itemIds.grain);
        details.player.outgoingPackets.chatboxMessage(`You put the grain in the hopper. You should now pull the lever nearby to operate`);
        details.player.outgoingPackets.chatboxMessage(`the hopper.`);
        details.player.metadata['grain'] = 1;
        details.player.busy = false;
    }, World.TICK_LENGTH);

};

export default new RunePlugin({
    type: ActionType.ITEM_ON_OBJECT_ACTION,
    objectIds: [2714],
    itemIds: [itemIds.grain],
    walkTo: true,
    action
});
