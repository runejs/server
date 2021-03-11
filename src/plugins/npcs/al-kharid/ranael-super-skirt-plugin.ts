import { npcActionHandler } from '@engine/world/action/npc-interaction.action';
import { findShop } from '@engine/config';


const tradeAction: npcActionHandler = ({ player }) =>
    findShop('rs:ranaels_skirt_store')?.open(player);

export default {
    type: 'npc_action',
    npcs: 'rs:alkharid_ranael',
    walkTo: true,
    options: 'trade',
    action: tradeAction,
};
