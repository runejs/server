import { objectActionHandler } from '@engine/world/action/object.action';
import { soundIds } from '@engine/world/config/sound-ids';
import { World } from '@engine/world';
import { cache } from '@engine/game-server';
import { getAllOreIds, getOreFromRock } from '@engine/world/config/harvestable-object';

const action: objectActionHandler = (details) => {
    details.player.sendMessage('You examine the rock for ores.');
    details.player.face(details.position);
    const ore = getOreFromRock(details.object.objectId);
    details.player.playSound(soundIds.oreEmpty, 7, 0);

    setTimeout(() => {
        if (!ore) {
            details.player.sendMessage('There is current no ore available in this rock.');
            return;
        }
        const oreName = cache.itemDefinitions.get(ore.itemId).name.toLowerCase().replace(' ore', '');

        details.player.sendMessage(`This rock contains ${oreName}.`);
    }, World.TICK_LENGTH * 3);
};

export default {
    type: 'object_action',
    options: ['prospect'],
    objectIds: getAllOreIds(),
    walkTo: true,
    action
};
