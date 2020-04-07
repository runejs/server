import { ActionType, RunePlugin } from '@server/plugins/plugin';
import { npcIds } from '@server/world/config/npc-ids';
import { npcInitAction } from '@server/world/actor/npc/npc';
import { loopingAction } from '@server/world/actor/player/action/action';

const action: npcInitAction = (details) => {
    const { npc } = details;

    loopingAction({ ticks: 16, npc }).event
        .subscribe(() => npc.say('Welcome to RuneJS!'));
};

export default new RunePlugin({ type: ActionType.NPC_INIT, npcIds: npcIds.tramp, action });
