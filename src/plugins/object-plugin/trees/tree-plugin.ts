import { objectAction, ObjectActionPlugin } from '@server/world/mob/player/action/object-action';
import { loopingAction } from '@server/world/mob/player/action/action';

const cycle = (player, i) => {
    player.packetSender.chatboxMessage(`i = ${i}`);
    return i < 10;
};

export const action: objectAction = (details) => {
    let i = 0;

    const loop = loopingAction(details.player);
    loop.event.subscribe(() => {
        if(!cycle(details.player, i++)) {
            loop.cancel();
        }
    });
};

export default { objectIds: [1278], options: [ 'chop down' ], walkTo: true, action } as ObjectActionPlugin;
