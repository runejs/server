import { objectAction, ObjectActionPlugin } from '@server/world/mob/player/action/object-action';
import { gameCache } from "@server/game-server";
import { Position } from '@server/world/position';


export const action: objectAction = (details) => {
    const { player, option, objectDefinition, object } = details;
    player.face(details.position);
    const emptyBucketItem = gameCache.itemDefinitions.get(1925);
    const milkBucketItem = gameCache.itemDefinitions.get(1927);

    if (player.hasItemInInventory(emptyBucketItem.id)) {
        player.face(new Position(object.x, object.y, player.position.level));
        player.playAnimation(2305);
        player.removeFirstItem(emptyBucketItem.id);
        player.giveItem(milkBucketItem.id);
        player.packetSender.chatboxMessage(`You ${ option } the ${ objectDefinition.name } and receive some milk.`);
    } else {
        player.packetSender.chatboxMessage(`You need a ${ emptyBucketItem.name } to ${ option } this ${ objectDefinition.name }!`);
    }
};

export default {objectIds: [8689], options: ['milk'], walkTo: true, action} as ObjectActionPlugin;
