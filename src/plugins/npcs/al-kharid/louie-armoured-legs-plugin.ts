import { npcAction } from '@server/world/action/npc-action';
import { openShop } from '@server/world/shops/shops';
import { npcIds } from '@server/world/config/npc-ids';

const tradeAction : npcAction = (details) => {
    openShop(details.player, 'LOUIES_ARMOURED_LEGS_BAZAR');
};

export default {
    type: 'npc_action',
    npcIds: npcIds.louieLegs,
    options: 'trade',
    walkTo: true,
    action: tradeAction
};