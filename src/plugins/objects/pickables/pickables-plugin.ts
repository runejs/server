import { objectAction } from '@server/world/mob/player/action/object-action';
import { gameCache, world } from '@server/game-server';
import { World } from '@server/world/world';
import { ActionType, RunePlugin } from '@server/plugins/plugin';


export const action: objectAction = (details) => {
    if(details.player.metadata['busy']) {
        return;
    }
    details.player.metadata['busy'] = true;
    details.player.playAnimation(827);
    let itemId: number = 1965;
    let prefix = 'some';
    switch (details.objectDefinition.name) {
        case 'Wheat':
            itemId = 1947;
            break;
        case 'Onion':
            itemId = 1957;
            prefix = 'an';
            break;
        case 'Potato':
            prefix = 'a';
            itemId = 1942;
            break;
        case 'Flax':
            itemId = 1779;
            break;
        case 'Cabbage':
        default:
            itemId = 1965;
            break;
    }
    const pickedItem = gameCache.itemDefinitions.get(itemId);
    setTimeout(() => {
        details.player.packetSender.chatboxMessage(`You ${details.option} the ${details.objectDefinition.name.toLowerCase()} and receive ${prefix} ${pickedItem.name.toLowerCase()}.`);
        if (details.objectDefinition.name !== 'Flax' || Math.floor(Math.random() * 10) === 1) {
            world.chunkManager.removeLandscapeObjectTemporarily(details.object, details.position, 30);
        }
        details.player.giveItem(pickedItem.id);
        details.player.metadata['busy'] = false;
    }, World.TICK_LENGTH);
};

export default new RunePlugin({ type: ActionType.OBJECT_ACTION, objectIds: [313, 5583, 5584, 5585, 1161, 3366,
        312, 2646], options: ['pick'], walkTo: true, action });
