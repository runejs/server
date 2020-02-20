import { npcAction, NpcActionPlugin } from '@server/world/mob/player/action/npc-action';
import { openShop } from '@server/world/mob/player/action/shop-action';

const action: npcAction = (details) => {
    const { player, npc } = details;
    openShop(details.player, 'BOBS_AXES');
};

export default { npcIds: 519, options: 'trade', walkTo: true, action } as NpcActionPlugin;
