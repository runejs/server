import { npcAction } from '@server/world/action/npc-action';
import { openShop } from '@server/world/shops/shops';

const tradeAction: npcAction = (details) => {
    openShop(details.player, 'BOBS_AXES');
};

export default { type: 'npc_action', npcs: 'rs:lumbridge_bob', options: 'trade', walkTo: true, action: tradeAction };
