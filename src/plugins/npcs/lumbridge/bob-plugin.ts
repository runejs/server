import { npcAction } from '@server/world/mob/player/action/npc-action';
import { openShop } from '@server/world/mob/player/action/shop-action';
import { ActionType, RunePlugin } from '@server/plugins/plugin';

const tradeAction: npcAction = (details) => {
    const { player, npc } = details;
    openShop(details.player, 'BOBS_AXES');
};

export default new RunePlugin({ type: ActionType.NPC_ACTION, npcIds: 519, options: 'trade', walkTo: true, action: tradeAction });
