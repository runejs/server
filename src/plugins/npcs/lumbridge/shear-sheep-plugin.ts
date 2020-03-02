import { World } from '@server/world/world';
import { ActionType, RunePlugin } from '@server/plugins/plugin';
import { itemIds } from '@server/world/config/item-ids';
import { itemOnObjectAction } from '@server/world/actor/player/action/item-on-object-action';
import { itemOnNpcAction } from '@server/world/actor/player/action/item-on-npc-action';


export const action: itemOnNpcAction = (details) => {
    details.player.busy = true;
    details.player.playAnimation(893);
    details.player.outgoingPackets.playSound(761, 5);

    setTimeout(() => {
        if (Math.random() >= 0.66) {
            details.player.outgoingPackets.chatboxMessage('The sheep manages to get away from you!');
            // TODO: sheep says baa!, makes baa sound and goes backwards about 5 tiles
        } else {
            details.player.outgoingPackets.chatboxMessage('You get some wool.');
            details.player.giveItem(1737);
            // TODO: sheep says baa!, makes baa sound and gets replaces with skinned sheep
        }
        details.npc.updateFlags.addChatMessage({ message: 'Baa!' });
        details.player.busy = false;
    }, World.TICK_LENGTH);

};

export default new RunePlugin({
    type: ActionType.ITEM_ON_NPC_ACTION,
    npcsIds: [43],
    itemIds: [1735, 5603],
    walkTo: true,
    action
});
