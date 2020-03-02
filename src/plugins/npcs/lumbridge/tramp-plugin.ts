import { ActionType, RunePlugin } from '@server/plugins/plugin';
import { npcIds } from '@server/world/config/npc-ids';
import { npcInitAction } from '@server/world/actor/npc/npc';

const action: npcInitAction = (details) => {
    setInterval(() => {
        details.npc.updateFlags.addChatMessage({ message: `Welcome to RuneJS!` });
    }, 10000);
};

export default new RunePlugin({ type: ActionType.NPC_INIT, npcIds: npcIds.tramp, action });
