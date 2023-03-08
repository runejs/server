import { itemOnObjectActionHandler } from '@engine/action';
import { filestore } from '@server/game/game-server';
import { itemIds } from '@engine/world/config/item-ids';
import { animationIds } from '@engine/world/config/animation-ids';
import { soundIds } from '@engine/world/config/sound-ids';
import { findItem } from '@engine/config/config-handler';
import { logger } from '@runejs/common';


const FountainIds: number[] = [879];
const SinkIds: number[] = [14878, 873];
const WellIds: number[] = [878];
export const handler: itemOnObjectActionHandler = (details) => {
    const { player, objectConfig, item } = details;
    const itemDef = findItem(item.itemId);

    if (!itemDef) {
        logger.error(`No item found for fill container plugin: ${item.itemId}`);
        return;
    }

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


    const objectName = details.objectConfig.name || '';
    if (!objectName) {
        logger.warn(`Fill container object ${details.object.objectId} has no name.`);
    }

    player.sendMessage(`You fill the ${itemDef.name.toLowerCase()} from the ${objectName.toLowerCase()}.`);

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
