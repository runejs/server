import { npcInitAction } from '@engine/world/actor/npc/npc';
import { World } from '@engine/world';
import { itemOnNpcActionHandler } from '@engine/world/action/item-on-npc.action';
import { itemIds } from '@engine/world/config/item-ids';
import { soundIds } from '@engine/world/config/sound-ids';
import { animationIds } from '@engine/world/config/animation-ids';


const initAction: npcInitAction = ({ npc }) => {
    setInterval(() => {
        if(Math.random() >= 0.66) {
            npc.say(`Baa!`);
            npc.playSound(soundIds.sheepBaa, 4);
        }
    }, (Math.floor(Math.random() * 20) + 10) * World.TICK_LENGTH);
};

export const shearAction: itemOnNpcActionHandler = ({ player, npc }) => {
    player.busy = true;
    player.playAnimation(animationIds.shearSheep);
    player.playSound(soundIds.shearSheep, 5);
    // set to face position, so it does not look weird when the player walk away
    npc.face(player.position);
    setTimeout(() => {
        if(Math.random() >= 0.66) {
            player.sendMessage('The sheep manages to get away from you!');
            npc.forceMovement(player.faceDirection, 5);
        } else {
            player.sendMessage('You get some wool.');
            player.giveItem(itemIds.wool);
            npc.say('Baa!');
            npc.playSound(soundIds.sheepBaa, 4);
            npc.transformInto('rs:naked_sheep');

            setTimeout(() => {
                npc.transformInto('rs:sheep');
            }, (Math.floor(Math.random() * 20) + 10) * World.TICK_LENGTH);
        }
        player.busy = false;
    }, World.TICK_LENGTH);

};
export default [
    {
        type: 'npc_init',
        npcs: 'rs:sheep',
        handler: initAction
    },
    {
        type: 'item_on_npc',
        npcs: 'rs:sheep',
        itemIds: [ itemIds.shears, itemIds.recruitmentDrive.shears ],
        walkTo: true,
        handler: shearAction
    }
];
