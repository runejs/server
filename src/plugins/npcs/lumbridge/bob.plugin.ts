import { npcInteractionActionHandler } from '@engine/world/action/npc-interaction.action';
import { findShop } from '@engine/config';


const action: npcInteractionActionHandler = ({ player }) =>
    findShop('rs:lumbridge_bobs_axes')?.open(player);

export default {
    pluginId: 'rs:bob',
    hooks: [
        {
            type: 'npc_interaction',
            npcs: 'rs:lumbridge_bob',
            options: 'trade',
            walkTo: true,
            handler: action
        }
    ]
};
