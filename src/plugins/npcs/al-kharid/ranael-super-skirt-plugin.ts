import { npcAction } from '@engine/world/action/npc-action';
import { findShop } from '@engine/config';


const tradeAction: npcAction = ({ player }) =>
    findShop('rs:ranaels_skirt_store')?.open(player);

export default {
    type: 'npc_action',
    npcs: 'rs:alkharid_ranael',
    walkTo: true,
    options: 'trade',
    action: tradeAction,
};
