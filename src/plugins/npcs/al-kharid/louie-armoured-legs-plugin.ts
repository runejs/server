import { npcAction } from '@server/world/actor/player/action/npc-action';
import { openShop } from '@server/world/actor/player/action/shop-action';
import { ActionType, RunePlugin } from '@server/plugins/plugin';
import { npcIds } from '@server/world/config/npc-ids';

const tradeAction : npcAction = (details) => {
    openShop(details.player, 'LOUIES_ARMOURED_LEGS_BAZAR');
};

export default new RunePlugin({
    type: ActionType.NPC_ACTION,
    npcIds: npcIds.louieLegs,
    options: 'trade',
    walkTo: true,
    action: tradeAction
});