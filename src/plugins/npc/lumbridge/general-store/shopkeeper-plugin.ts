import { npcAction, NpcActionPlugin } from '@server/world/mob/player/action/npc-action';
import { openShop } from '@server/world/config/shops';

const action: npcAction = (details) => {
    const { player, npc } = details;
    openShop(details.player, 'LUMBRIDGE_GENERAL_STORE');
};

export default { npcIds: 520, options: 'trade', walkTo: true, action } as NpcActionPlugin;
