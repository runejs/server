import { npcIds } from '@server/world/config/npc-ids';
import { npcInitAction } from '@server/world/actor/npc/npc';
import { loopingAction } from '@server/world/action/action';

const action: npcInitAction = (details) => {
    const { npc } = details;

    loopingAction({ ticks: 16, npc }).event
        .subscribe(() => npc.say('Welcome to RuneJS!'));
};

export default { type: 'npc_init', npcIds: npcIds.tramp, action };
