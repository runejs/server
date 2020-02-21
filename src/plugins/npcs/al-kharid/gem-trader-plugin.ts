import { npcAction } from '@server/world/mob/player/action/npc-action';
import { ActionType, RunePlugin } from '@server/plugins/plugin';
import { openShop } from '@server/world/mob/player/action/shop-action';

const tradeAction : npcAction = (details)  => {
    openShop(details.player, 'ALKHARID_GEM_TRADER');
};

export default new RunePlugin({type: ActionType.NPC_ACTION, npcIds: 540, options: 'trade', walkTo: true, action: tradeAction});