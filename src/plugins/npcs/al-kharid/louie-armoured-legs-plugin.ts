import { npcAction } from '@server/world/action/npc-action';
import { openShop } from '@server/world/shops/shops';

const tradeAction : npcAction = (details) => {
    openShop(details.player, 'LOUIES_ARMOURED_LEGS_BAZAR');
};

export default {
    type: 'npc_action',
    npcs: 'rs:alkharid_louie',
    options: 'trade',
    walkTo: true,
    action: tradeAction
};
