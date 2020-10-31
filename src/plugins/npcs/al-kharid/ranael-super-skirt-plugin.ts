import { npcAction } from '@server/world/actor/player/action/npc-action';
import { openShop } from '@server/world/actor/player/action/shop-action';
import { npcIds } from '@server/world/config/npc-ids';

const tradeAction : npcAction = (details) => {
    openShop(details.player, 'RANAELS_SUPER_SKIRT_STORE');
};

export default {
    type: 'npc_action',
    npcIds: npcIds.ranael,
    walkTo: true,
    options: 'trade',
    action: tradeAction,
};