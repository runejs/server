import { npcActionHandler } from '@engine/world/action/npc.action';
import { findShop } from '@engine/config';


const action: npcActionHandler = ({ player }) =>
    findShop('rs:lumbridge_general_store')?.open(player);

export default {
    type: 'npc_action',
    npcs: 'rs:lumbridge_shop_keeper',
    options: 'trade',
    walkTo: true,
    action
};
