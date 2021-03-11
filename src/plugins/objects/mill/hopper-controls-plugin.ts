import { objectInteractionActionHandler } from '@engine/world/action/object-interaction.action';
import { World } from '@engine/world';
import { LocationObject } from '@runejs/cache-parser';


export const action: objectInteractionActionHandler = (details) => {
    details.player.busy = true;
    details.player.playAnimation(3571);
    details.player.playSound(2400, 5);
    details.player.personalInstance.replaceGameObject(2722, details.object, 1);

    setTimeout(() => {
        if (details.player.metadata['grain'] && details.player.metadata['grain'] >= 1) {
            details.player.sendMessage(`You operate the hopper. The grain slide down the chute.`);
            if (!details.player.metadata['flour']) {
                details.player.metadata['flour'] = 0;
            }
            details.player.metadata['flour'] += details.player.metadata['grain'];
            details.player.metadata['grain'] = 0;
            const fullFlourBin: LocationObject = { objectId: 1782, x: 3166, y: 3306, orientation: 0, level: 0, type: 10 };
            details.player.personalInstance.spawnGameObject(fullFlourBin);
        } else {
            details.player.sendMessage(`You operate the hopper. Nothing interesting happens.`);
        }
        details.player.busy = false;
    }, World.TICK_LENGTH);

};

export default {
    type: 'object_action',
    objectIds: [2718],
    options: ['operate'],
    walkTo: true,
    handler: action
};
