import { objectAction } from '@server/world/mob/player/action/object-action';
import { gameCache } from "@server/game-server";
import { ActionType, RunePlugin } from '@server/plugins/plugin';


export const action: objectAction = (details) => {
    const { player, option, objectDefinition, object } = details;
    const emptyBucketItem = gameCache.itemDefinitions.get(1925);
    const milkBucketItem = gameCache.itemDefinitions.get(1927);

    if(player.hasItemInInventory(emptyBucketItem.id)) {
        player.playAnimation(2305);
        player.removeFirstItem(emptyBucketItem.id);
        player.giveItem(milkBucketItem.id);
        player.packetSender.chatboxMessage(`You ${ option } the ${ objectDefinition.name } and receive some milk.`);
    } else {
        player.packetSender.chatboxMessage(`You need a ${ emptyBucketItem.name } to ${ option } this ${ objectDefinition.name }!`);
    }
};

export default new RunePlugin({ type: ActionType.OBJECT_ACTION, objectIds: [8689], options: ['milk'], walkTo: true, action });
