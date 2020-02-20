import { objectAction } from '@server/world/mob/player/action/object-action';
import { loopingAction } from '@server/world/mob/player/action/action';
import { ActionType, RunePlugin } from '@server/plugins/plugin';

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

export default new RunePlugin({ type: ActionType.OBJECT_ACTION, objectIds: [1278], options: [ 'chop down' ], walkTo: true, action });
