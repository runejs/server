import { npcAction } from '@server/world/action/npc-action';
import { openShop } from '@server/world/shops/shops';
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