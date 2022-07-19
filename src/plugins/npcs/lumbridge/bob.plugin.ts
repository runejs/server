import { ContentPlugin } from '@engine/plugins';
import { NpcInteractionActionHook } from '@engine/action';
import { findShop } from '@engine/config';


const bobHook: NpcInteractionActionHook = {
    type: 'npc_interaction',
    npcs: 'rs:lumbridge_bob',
    options: 'trade',
    walkTo: true,
    handler: ({ player }) => findShop('rs:lumbridge_bobs_axes')?.open(player)
};

const bobPlugin: ContentPlugin = {
    pluginId: 'rs:bob',
    hooks: [ bobHook ]
}

export default bobPlugin;
