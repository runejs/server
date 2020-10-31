import { npcIds } from '@server/world/config/npc-ids';
import { npcInitAction } from '@server/world/actor/npc/npc';
import { World } from '@server/world/world';
import { itemOnNpcAction } from '@server/world/actor/player/action/item-on-npc-action';
import { itemIds } from '@server/world/config/item-ids';
import { soundIds } from '@server/world/config/sound-ids';
import { animationIds } from '@server/world/config/animation-ids';

const initAction: npcInitAction = (details) => {
    setInterval(() => {
        if (Math.random() >= 0.66) {
            details.npc.say(`Baa!`);
            details.npc.playSound(soundIds.sheepBaa, 4);
        }
    }, (Math.floor(Math.random() * 20) + 10) * World.TICK_LENGTH);
};

export const shearAction: itemOnNpcAction = (details) => {
    details.player.busy = true;
    details.player.playAnimation(animationIds.shearSheep);
    details.player.playSound(soundIds.shearSheep, 5);
    // set to face position, so it does not look weird when the player walk away
    details.npc.face(details.player.position);
    setTimeout(() => {
        if (Math.random() >= 0.66) {
            details.player.sendMessage('The sheep manages to get away from you!');
            details.npc.forceMovement(details.player.faceDirection, 5);
        } else {
            details.player.sendMessage('You get some wool.');
            details.player.giveItem(itemIds.wool);
            details.npc.say('Baa!');
            details.npc.playSound(soundIds.sheepBaa, 4);
            details.npc.setNewId(npcIds.nakedSheep);

            setTimeout(() => {
                details.npc.setNewId(npcIds.sheep);
            }, (Math.floor(Math.random() * 20) + 10) * World.TICK_LENGTH);
        }
        details.player.busy = false;
    }, World.TICK_LENGTH);

};
export default [
    {
        type: 'npc_init',
        npcIds: npcIds.sheep,
        action: initAction
    },
    {
        type: 'item_on_npc',
        npcsIds: [npcIds.sheep],
        itemIds: [itemIds.shears, itemIds.recruitmentDrive.shears],
        walkTo: true,
        action: shearAction
    }
];
