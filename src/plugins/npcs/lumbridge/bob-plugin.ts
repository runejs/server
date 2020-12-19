import { npcAction } from '@server/world/action/npc-action';
import { findShop } from '@server/config';


const action: npcAction = ({ player }) =>
    findShop('rs:lumbridge_bobs_axes')?.open(player);

export default {
    type: 'npc_action',
    npcs: 'rs:lumbridge_bob',
    options: 'trade',
    walkTo: true,
    action
};
