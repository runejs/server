import { objectAction } from '@server/world/actor/player/action/object-action';
import { gameCache } from '@server/game-server';
import { ActionType, RunePlugin } from '@server/plugins/plugin';
import { dialogueAction, DialogueEmote } from '@server/world/actor/player/action/dialogue-action';
import { npcIds } from '@server/world/config/npc-ids';
import { animationIds } from '@server/world/config/animation-ids';
import { soundIds } from '@server/world/config/sound-ids';
import { itemIds } from '@server/world/config/item-ids';
import { objectIds } from '@server/world/config/object-ids';
import { itemOnObjectAction } from '@server/world/actor/player/action/item-on-object-action';

function milkCow(details) {
    const { player, objectDefinition } = details;
    const emptyBucketItem = gameCache.itemDefinitions.get(itemIds.bucket);

    if (player.hasItemInInventory(itemIds.bucket)) {
        player.playAnimation(animationIds.milkCow);
        player.outgoingPackets.playSound(soundIds.milkCow, 7);
        player.removeFirstItem(itemIds.bucket);
        player.giveItem(itemIds.bucketOfMilk);
        player.outgoingPackets.chatboxMessage(`You milk the ${objectDefinition.name} and receive some milk.`);
    } else {
        dialogueAction(player)
            .then(d => d.npc(npcIds.gillieGroats, DialogueEmote.LAUGH_1, [`Tee hee! You've never milked a cow before, have you?`]))
            .then(d => d.player(DialogueEmote.CALM_TALK_1, ['Erm... No. How could you tell?']))
            .then(d => d.npc(npcIds.gillieGroats, DialogueEmote.LAUGH_2, [`Because you're spilling milk all over the floor. What a`, 'waste! You need something to hold the milk.']))
            .then(d => d.player(DialogueEmote.CONSIDERING, [`Ah yes, I really should have guessed that one, shouldn't`, 'I?']))
            .then(d => d.npc(npcIds.gillieGroats, DialogueEmote.LAUGH_2, [`You're from the city aren't you... Try it again with a`, `${emptyBucketItem.name.toLowerCase()}.`]))
            .then(d => d.player(DialogueEmote.CALM_TALK_2, [`Right, I'll do that.`]))
            .then(d => {
                d.close();
            });
    }
}

export const actionItem: itemOnObjectAction = (details) => milkCow(details);

export const actionInteract: objectAction = (details) => milkCow(details);

export default new RunePlugin(
    [
        {
            type: ActionType.OBJECT_ACTION,
            objectIds: objectIds.milkableCow,
            options: 'milk',
            walkTo: true,
            action: actionInteract
        },
        {
            type: ActionType.ITEM_ON_OBJECT_ACTION,
            objectIds: objectIds.milkableCow,
            itemIds: itemIds.bucket,
            walkTo: true,
            action: actionItem
        }
    ]);
