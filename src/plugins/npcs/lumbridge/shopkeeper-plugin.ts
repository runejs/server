import { npcAction } from '@server/world/action/npc-action';
import { openShop } from '@server/world/shops/shops';
import { npcIds } from '@server/world/config/npc-ids';

const action: npcAction = (details) => {
    openShop(details.player, 'LUMBRIDGE_GENERAL_STORE');
};

export default { type: 'npc_action', npcIds: npcIds.shopKeeper, options: 'trade', walkTo: true, action };
