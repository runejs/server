import { npcAction } from '@server/world/action/npc-action';
import { openShop } from '@server/world/shops/shops';

const tradeAction : npcAction = (details) => {
    openShop(details.player, 'RANAELS_SUPER_SKIRT_STORE');
};

export default {
    type: 'npc_action',
    npcs: 'rs:alkharid_ranael',
    walkTo: true,
    options: 'trade',
    action: tradeAction,
};
