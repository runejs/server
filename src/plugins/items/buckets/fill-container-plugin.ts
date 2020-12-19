import { itemOnObjectAction } from '@server/world/action/item-on-object-action';
import { cache } from '@server/game-server';
import { itemIds } from '@server/world/config/item-ids';
import { animationIds } from '@server/world/config/animation-ids';
import { soundIds } from '@server/world/config/sound-ids';
import { RunePlugin } from '@server/plugins/plugin';
import { ActionType } from '@server/world/action';

const FountainIds: number[] = [879];
const SinkIds: number[] = [14878, 873];
const WellIds: number[] = [878];
export const action: itemOnObjectAction = (details) => {
    const { player, objectDefinition, item } = details;
    const itemDef = cache.itemDefinitions.get(item.itemId);
    if (item.itemId !== itemIds.bucket && WellIds.indexOf(objectDefinition.id) > -1) {
        player.sendMessage(`If I drop my ${itemDef.name.toLowerCase()} down there, I don't think I'm likely to get it back.`);
        return;
    }

    player.playAnimation(animationIds.fillContainerWithWater);
    player.playSound(soundIds.fillContainerWithWater, 7);
    player.removeFirstItem(item.itemId);
    switch (item.itemId) {
        case itemIds.bucket:
            player.giveItem(itemIds.bucketOfWater);
            break;
        case itemIds.jug:
            player.giveItem(itemIds.jugOfWater);
            break;


    }

    player.sendMessage(`You fill the ${itemDef.name.toLowerCase()} from the ${objectDefinition.name.toLowerCase()}.`);

};

export default {
    type: 'item_on_object',
    objectIds: [...FountainIds, ...WellIds, ...SinkIds],
    itemIds: [itemIds.bucket, itemIds.jug],
    walkTo: true,
    action
};
