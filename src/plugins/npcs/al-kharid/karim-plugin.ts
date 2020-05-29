import {npcAction} from "@server/world/actor/player/action/npc-action";
import {dialogueAction, DialogueEmote} from "@server/world/actor/player/action/dialogue-action";
import {ActionType, RunePlugin} from "@server/plugins/plugin";
import {npcIds} from "@server/world/config/npc-ids";
import {itemIds} from "@server/world/config/item-ids";
import {widgets} from "@server/world/config/widget";

const talkToAction : npcAction = (details) => {
    const { player, npc } = details;
    dialogueAction(player)
        .then(d => d.npc(npc, DialogueEmote.JOYFUL, ['Would you like to buy a nice kebab? Only one gold.']))
        .then(d => d.options('Would you like to buy a nice kebab? Only one gold.', ['I think I\'ll give it a miss.', 'Yes please.']))
        .then(async d => {
            switch (d.action) {
                case 1:
                    await d.player(DialogueEmote.CALM_TALK_1, ['I think i\'ll give it a miss.']);
                    break;

                case 2:
                    await d.player(DialogueEmote.JOYFUL, ['Yes please.']);
                    let inventory = player.inventory;
                    if (inventory.has(itemIds.coins)) {
                        let index = inventory.findIndex(itemIds.coins);
                        let item = inventory.items[index];

                        if (!inventory.hasSpace()) {
                            await player.sendMessage(`You don't have enough space in your inventory.`);
                            d.close();
                            return;
                        }

                        inventory.remove(index);
                        if (item.amount !== 1) {
                            inventory.add({itemId: itemIds.coins, amount: item.amount-1});
                        }

                        inventory.add({itemId: itemIds.kebab, amount: 1});
                        player.outgoingPackets.sendUpdateAllWidgetItems(widgets.inventory, inventory);
                        d.close();
                    }

                    if (!inventory.has(itemIds.coins)) {
                        d.player(DialogueEmote.ANNOYED, ['Oops, I forgot to bring any money with me.'])
                            .then(d => d.npc(npc, DialogueEmote.CALM_TALK_1, ['Come back when you have some.']))
                            .then(d => d.close());
                    }
                    break;
            }
        });
};

export default new RunePlugin([
    { type: ActionType.NPC_ACTION, npcIds: npcIds.karim, options: 'talk-to', walkTo: true, action: talkToAction}
]);
