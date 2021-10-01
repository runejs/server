import { itemOnObjectActionHandler } from '@engine/world/action/item-on-object.action';
import { filestore } from '@engine/game-server';
import { itemIds } from '@engine/world/config/item-ids';
import { animationIds } from '@engine/world/config/animation-ids';
import { soundIds } from '@engine/world/config/sound-ids';
import { findItem } from '@engine/config/config-handler';


const FountainIds: number[] = [879];
const SinkIds: number[] = [14878, 873];
const WellIds: number[] = [878];
export const handler: itemOnObjectActionHandler = (details) => {
    const { player, objectConfig, item } = details;
    const itemDef = findItem(item.itemId);
    if (item.itemId !== itemIds.bucket && WellIds.indexOf(objectConfig.gameId) > -1) {
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

    player.sendMessage(`You fill the ${itemDef.name.toLowerCase()} from the ${objectConfig.name.toLowerCase()}.`);

};

export default {
    pluginId: 'rs:fill_container',
    hooks: [
        {
            type: 'item_on_object',
            objectIds: [ ...FountainIds, ...WellIds, ...SinkIds ],
            itemIds: [ itemIds.bucket, itemIds.jug ],
            walkTo: true,
            handler
        }
    ]
};
