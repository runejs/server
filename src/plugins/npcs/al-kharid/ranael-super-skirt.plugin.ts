import { npcInteractionActionHandler } from '@engine/action';
import { findShop } from '@engine/config/config-handler';


const tradeAction: npcInteractionActionHandler = ({ player }) =>
    findShop('rs:ranaels_skirt_store')?.open(player);

export default {
    pluginId: 'rs:ranael_super_skirt',
    hooks: [{
        type: 'npc_interaction',
        npcs: 'rs:alkharid_ranael',
        walkTo: true,
        options: 'trade',
        handler: tradeAction
    }]
};
