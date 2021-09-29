import { objectInteractionActionHandler } from '@engine/world/action/object-interaction.action';
import { soundIds } from '@engine/world/config/sound-ids';
import { World } from '@engine/world';
import { filestore } from '@engine/game-server';
import { getAllOreIds, getOreFromRock } from '@engine/world/config/harvestable-object';
import { findItem } from '@engine/config/config-handler';

const action: objectInteractionActionHandler = (details) => {
    details.player.sendMessage('You examine the rock for ores.');
    details.player.face(details.position);
    const ore = getOreFromRock(details.object.objectId);
    details.player.playSound(soundIds.oreEmpty, 7, 0);

    setTimeout(() => {
        if (!ore) {
            details.player.sendMessage('There is current no ore available in this rock.');
            return;
        }
        const oreName = findItem(ore.itemId).name.toLowerCase().replace(' ore', '');

        details.player.sendMessage(`This rock contains ${oreName}.`);
    }, World.TICK_LENGTH * 3);
};

export default {
    pluginId: 'rs:prospecting',
    hooks: [ {
        type: 'object_interaction',
        options: [ 'prospect' ],
        objectIds: getAllOreIds(),
        walkTo: true,
        handler: action
    } ]
};
