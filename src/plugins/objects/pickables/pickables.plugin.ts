import { objectInteractionActionHandler } from '@engine/action';
import { World } from '@engine/world';
import { itemIds } from '@engine/world/config/item-ids';
import { findItem } from '@engine/config/config-handler';
import { logger } from '@runejs/common';


export const action: objectInteractionActionHandler = (details) => {
    details.player.busy = true;
    details.player.playAnimation(827);
    let itemId: number;
    let prefix = 'some';
    switch (details.objectConfig.name) {
        case 'Wheat':
            itemId = itemIds.grain;
            break;
        case 'Onion':
            itemId = itemIds.onion;
            prefix = 'an';
            break;
        case 'Potato':
            prefix = 'a';
            itemId = itemIds.potato;
            break;
        case 'Flax':
            itemId = itemIds.flax;
            break;
        case 'Cabbage':
        default:
            itemId = itemIds.cabbage;
            break;
    }
    const pickedItem = findItem(itemId);

    if (!pickedItem) {
        logger.warn(`Could not find item for pickable with id ${itemId}`);
        details.player.busy = false;
        return;
    }

    // this used to use `setInterval` but will need rewriting to be synced with ticks
    // see https://github.com/runejs/server/issues/417
    details.player.sendMessage('[debug] see issue #417');
    // setTimeout(() => {
    //     details.player.sendMessage(`You ${details.option} the ${(details.objectConfig.name || '').toLowerCase()} and receive ${prefix} ${pickedItem.name.toLowerCase()}.`);
    //     details.player.playSound(2581, 7);
    //     if (details.objectConfig.name !== 'Flax' || Math.floor(Math.random() * 10) === 1) {
    //         details.player.instance.hideGameObjectTemporarily(details.object, 30);
    //     }
    //     details.player.giveItem(pickedItem.gameId);
    //     details.player.busy = false;
    // }, World.TICK_LENGTH);
};

export default {
    pluginId: 'rs:pickables',
    hooks: [
        {
            type: 'object_interaction',
            objectIds: [ 313, 5583, 5584, 5585, 1161, 3366, 312, 2646 ],
            options: [ 'pick' ],
            walkTo: true,
            handler: action
        }
    ]
};
