import { objectAction } from '@server/world/action/object-action';
import { cache, world } from '@server/game-server';
import { World } from '@server/world';
import { itemIds } from '@server/world/config/item-ids';


export const action: objectAction = (details) => {
    details.player.busy = true;
    details.player.playAnimation(827);
    let itemId: number = itemIds.cabbage;
    let prefix = 'some';
    switch (details.objectDefinition.name) {
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
    const pickedItem = cache.itemDefinitions.get(itemId);
    setTimeout(() => {
        details.player.sendMessage(`You ${details.option} the ${details.objectDefinition.name.toLowerCase()} and receive ${prefix} ${pickedItem.name.toLowerCase()}.`);
        details.player.playSound(2581, 7);
        if (details.objectDefinition.name !== 'Flax' || Math.floor(Math.random() * 10) === 1) {
            world.removeLocationObjectTemporarily(details.object, details.position, 30);
        }
        details.player.giveItem(pickedItem.id);
        details.player.busy = false;
    }, World.TICK_LENGTH);
};

export default { type: 'object_action', objectIds: [313, 5583, 5584, 5585, 1161, 3366,
        312, 2646], options: ['pick'], walkTo: true, action };
