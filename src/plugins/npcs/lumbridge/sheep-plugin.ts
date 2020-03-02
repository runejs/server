import { ActionType, RunePlugin } from '@server/plugins/plugin';
import { npcIds } from '@server/world/config/npc-ids';
import { npcInitAction } from '@server/world/actor/npc/npc';
import { World } from '@server/world/world';
import { itemOnNpcAction } from '@server/world/actor/player/action/item-on-npc-action';
import { itemIds } from '@server/world/config/item-ids';
import { soundIds } from '@server/world/config/sound-ids';

const initAction: npcInitAction = (details) => {
    setInterval(() => {
        if (Math.random() >= 0.66) {
            details.npc.updateFlags.addChatMessage({message: `Baa!`});
            details.npc.sendSound(soundIds.sheepBaa, 7);
        }
    }, 3 * World.TICK_LENGTH);
};

export const shearAction: itemOnNpcAction = (details) => {
    details.player.busy = true;
    details.player.playAnimation(893);
    details.player.outgoingPackets.playSound(761, 5);

    setTimeout(() => {
        if (Math.random() >= 0.66) {
            details.player.outgoingPackets.chatboxMessage('The sheep manages to get away from you!');
            // TODO: sheep says baa!, makes baa sound and goes backwards about 5 tiles
        } else {
            details.player.outgoingPackets.chatboxMessage('You get some wool.');
            details.player.giveItem(itemIds.wool);
            // TODO: sheep says baa!, makes baa sound and gets replaces with skinned sheep
        }
        details.npc.updateFlags.addChatMessage({message: 'Baa!'});
        details.player.busy = false;
    }, World.TICK_LENGTH);

};
export default new RunePlugin([
        {
            type: ActionType.NPC_INIT,
            npcIds: npcIds.sheep,
            action: initAction
        },
        {
            type: ActionType.ITEM_ON_NPC_ACTION,
            npcsIds: [npcIds.sheep],
            itemIds: [itemIds.shears, itemIds.recruitment_drive.shears],
            walkTo: true,
            action: shearAction
        }
    ]
);
