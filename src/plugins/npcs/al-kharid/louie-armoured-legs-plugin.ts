import { npcAction } from '@server/world/actor/player/action/npc-action';
import { openShop } from '@server/world/actor/player/action/shop-action';
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