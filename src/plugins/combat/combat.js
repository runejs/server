import { DamageType } from '../../world/actor/update-flags';
import { ActionType } from '../plugin';
import { loopingAction, walkToAction } from '../../world/actor/player/action/action';
import { schedule } from '../../task/task';

// Work-in-progress...
const action = async details => {
    const { player, npc } = details;

    const loop = loopingAction({ ticks: 5, player, npc });
    const loopSub = loop.event.subscribe(async () => {
        if(player.position.distanceBetween(npc.position) > 1) {
            walkToAction(player, npc.position);
            return;
        }

        npc.updateFlags.addDamage(1, DamageType.DAMAGE, 4, 5);

        await schedule(3);

        player.updateFlags.addDamage(1, DamageType.DAMAGE, 4, 5);
    });
};

module.exports = {
    type: ActionType.NPC_ACTION,
    options: 'attack',
    walkTo: true,
    action
};
