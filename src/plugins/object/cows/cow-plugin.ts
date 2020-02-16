import { objectAction, ObjectActionPlugin } from '@server/world/mob/player/action/object-action';
import { gameCache } from "@server/game-server";


export const action: objectAction = (details) => {
    const emptyBucketItem = gameCache.itemDefinitions.get(1925);
    const milkBucketItem = gameCache.itemDefinitions.get(1927);

    if (details.player.hasItemInInventory(emptyBucketItem.id)) {
        details.player.playAnimation(2305);
        details.player.removeFirstItem(emptyBucketItem.id);
        details.player.giveItem(milkBucketItem.id);
        details.player.packetSender.chatboxMessage(`You ${ details.option } the ${ details.objectDefinition.name } and receive some milk.`);
    } else {
        details.player.packetSender.chatboxMessage(`You need a ${ emptyBucketItem.name } to ${ details.option } this ${ details.objectDefinition.name }!`);
    }
};

export default {objectIds: [8689], options: ['milk'], walkTo: true, action} as ObjectActionPlugin;
