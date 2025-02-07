import type { npcInteractionActionHandler } from '@engine/action/pipe/npc-interaction.action';
import { findShop } from '@engine/config/config-handler';

const tradeAction: npcInteractionActionHandler = ({ player }) => findShop('rs:test_shop')?.open(player);

export default {
    pluginId: 'rs:test-shop',
    hooks: [{ type: 'npc_interaction', npcs: 'rs:dromunds_cat', options: 'talk-to', walkTo: true, handler: tradeAction }],
};
