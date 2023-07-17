import { objectInteractionActionHandler } from '@engine/action';
import { World } from '@engine/world';


export const action: objectInteractionActionHandler = (details) => {
    details.player.busy = true;
    details.player.playAnimation(3571);
    details.player.playSound(2400, 5);
    details.player.personalInstance.replaceGameObject(2722, details.object, 1);

    // this used to use `setInterval` but will need rewriting to be synced with ticks
    // see https://github.com/runejs/server/issues/417
    details.player.sendMessage('[debug] see issue #417');
    // setTimeout(() => {
    //     if (details.player.savedMetadata['mill-grain'] && details.player.savedMetadata['mill-grain'] >= 1) {
    //         details.player.sendMessage(`You operate the hopper. The grain slide down the chute.`);
    //         if (!details.player.savedMetadata['mill-flour']) {
    //             details.player.savedMetadata['mill-flour'] = 0;
    //         }
    //         details.player.savedMetadata['mill-flour'] += details.player.savedMetadata['mill-grain'];
    //         details.player.savedMetadata['mill-grain'] = 0;
    //         details.player.outgoingPackets.updateClientConfig(695, 1);
    //     } else {
    //         details.player.sendMessage(`You operate the hopper. Nothing interesting happens.`);
    //     }
    //     details.player.busy = false;
    // }, World.TICK_LENGTH);

};

export default {
    pluginId: 'rs:grain_hopper_controls',
    hooks: [
        {
            type: 'object_interaction',
            objectIds: [ 2718, 2721 ],
            options: [ 'operate' ],
            walkTo: true,
            handler: action
        }
    ]
};
