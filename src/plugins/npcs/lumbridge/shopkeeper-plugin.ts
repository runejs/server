import { npcAction } from '@server/world/action/npc-action';
import { openShop } from '@server/world/shops/shops';

const action: npcAction = (details) => {
    openShop(details.player, 'LUMBRIDGE_GENERAL_STORE');
};

export default { type: 'npc_action', npcs: 'rs:lumbridge_shop_keeper', options: 'trade', walkTo: true, action };
