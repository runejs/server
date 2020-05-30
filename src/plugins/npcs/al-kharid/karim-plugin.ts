import { npcAction } from '@server/world/actor/player/action/npc-action';
import { dialogueAction, DialogueEmote } from '@server/world/actor/player/action/dialogue-action';
import { ActionType, RunePlugin } from '@server/plugins/plugin';
import { npcIds } from '@server/world/config/npc-ids';
import { itemIds } from '@server/world/config/item-ids';
import { widgets } from '@server/world/config/widget';
import { dialogue, Emote, execute, goto } from '@server/world/actor/dialogue';

const talkToAction : npcAction = (details) => {
    const { player, npc } = details;

    dialogue([player, {npc, key: 'karim'}], [
        karim => [ Emote.HAPPY, `Would you like to buy a nice kebab? Only one gold.`],
        options => [
            `I think i'll give it a miss.`, [
                player => [Emote.DROWZY, `I think i'll give it a miss.`],
            ],
            `Yes please.`, [
                player => [Emote.HAPPY, `Yes please.`],
                execute(() => {
                    let inventory = player.inventory;
                    if (inventory.has(itemIds.coins)) {
                        let index = inventory.findIndex(itemIds.coins);
                        let item = inventory.items[index];

                        if (!inventory.hasSpace()) {
                            player.sendMessage(`You don't have enough space in your inventory.`);
                            return;
                        }

                        inventory.remove(index);
                        if (item.amount !== 1) {
                            inventory.add({itemId: itemIds.coins, amount: item.amount-1});
                        }

                        inventory.add({itemId: itemIds.kebab, amount: 1});
                        player.outgoingPackets.sendUpdateAllWidgetItems(widgets.inventory, inventory);
                        return;
                    }

                    if (!inventory.has(itemIds.coins)) {
                        dialogue([player, {npc, key: 'karim'}], [
                            (player, no_Money) => [Emote.ANGRY, `Oops, I forgot to bring any money with me.`],
                            karim => [Emote.GENERIC, `Come back when you have some.`]
                        ]);
                    }
                })
            ]
        ]
    ]);
};

export default new RunePlugin([
    { type: ActionType.NPC_ACTION, npcIds: npcIds.karim, options: 'talk-to', walkTo: true, action: talkToAction}
]);
