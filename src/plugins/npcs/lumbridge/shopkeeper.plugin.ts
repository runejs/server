import { npcInteractionActionHandler } from '@engine/action';
import { findShop } from '@engine/config/config-handler';


const action: npcInteractionActionHandler = ({ player }) => {
    findShop('rs:lumbridge_general_store')?.open(player);

}
export default {
    pluginId: 'rs:lumbridge_general_store',
    hooks: [
        {
            type: 'npc_interaction',
            npcs: 'rs:lumbridge_shop_keeper',
            options: 'trade',
            walkTo: true,
            handler: action
        }
    ]
};
