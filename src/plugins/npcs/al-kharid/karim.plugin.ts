import { npcInteractionActionHandler } from '@engine/action';
import { itemIds } from '@engine/world/config/item-ids';
import { dialogue, Emote, execute } from '@engine/world/actor/dialogue';
import { widgets } from '@engine/config/config-handler';

const talkToAction : npcInteractionActionHandler = (details) => {
    const { player, npc } = details;

    dialogue([player, { npc, key: 'karim' }], [
        karim => [ Emote.HAPPY, `Would you like to buy a nice kebab? Only one gold.`],
        options => [
            `I think i'll give it a miss.`, [
                player => [Emote.DROWZY, `I think i'll give it a miss.`],
            ],
            `Yes please.`, [
                player => [Emote.HAPPY, `Yes please.`],
                execute(() => {
                    const inventory = player.inventory;
                    if (inventory.has(itemIds.coins)) {
                        const index = inventory.findIndex(itemIds.coins);
                        const item = inventory.items[index];

                        if (!inventory.hasSpace()) {
                            player.sendMessage(`You don't have enough space in your inventory.`);
                            return;
                        }

                        inventory.remove(index);
                        if (item.amount !== 1) {
                            inventory.add( { itemId: itemIds.coins, amount: item.amount - 1 });
                        }

                        inventory.add({ itemId: itemIds.kebab, amount: 1 });
                        player.outgoingPackets.sendUpdateAllWidgetItems(widgets.inventory, inventory);
                        return;
                    }

                    if (!inventory.has(itemIds.coins)) {
                        dialogue([player, { npc, key: 'karim' }], [
                            player => [Emote.ANGRY, `Oops, I forgot to bring any money with me.`],
                            karim => [Emote.GENERIC, `Come back when you have some.`]
                        ]);
                    }
                })
            ]
        ]
    ]);
};

export default {
    pluginId: 'rs:karim',
    hooks: [
        { type: 'npc_interaction', npcs: 'rs:alkharid_karim', options: 'talk-to', walkTo: true, handler: talkToAction }
    ]
};
