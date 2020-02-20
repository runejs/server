import { npcAction } from '@server/world/mob/player/action/npc-action';
import { openShop } from '@server/world/mob/player/action/shop-action';
import { ActionType, RunePlugin } from '@server/plugins/plugin';


const action: npcAction = (details) => {
    const { player, npc } = details;
    openShop(details.player, 'LUMBRIDGE_GENERAL_STORE');
};

export default new RunePlugin({ type: ActionType.NPC_ACTION, npcIds: 520, options: 'trade', walkTo: true, action });
