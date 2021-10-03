import { objectInteractionActionHandler } from '@engine/action/object-interaction.action';
import { dialogueAction, DialogueEmote } from '@engine/world/actor/player/dialogue-action';
import { animationIds } from '@engine/world/config/animation-ids';
import { soundIds } from '@engine/world/config/sound-ids';
import { itemIds } from '@engine/world/config/item-ids';
import { objectIds } from '@engine/world/config/object-ids';
import { itemOnObjectActionHandler } from '@engine/action/item-on-object.action';
import { Player } from '@engine/world/actor/player/player';
import { findItem, findNpc } from '@engine/config/config-handler';
import { ObjectConfig } from '@runejs/filestore';


function milkCow(details: { objectConfig: ObjectConfig, player: Player }): void {
    const { player, objectConfig } = details;
    const emptyBucketItem = findItem(itemIds.bucket);

    if (player.hasItemInInventory(itemIds.bucket)) {
        player.playAnimation(animationIds.milkCow);
        player.playSound(soundIds.milkCow, 7);
        player.removeFirstItem(itemIds.bucket);
        player.giveItem(itemIds.bucketOfMilk);
        player.sendMessage(`You milk the ${objectConfig.name} and receive some milk.`);
    } else {
        const gillieId = findNpc('rs:gillie_groats').gameId;
        dialogueAction(player)
            .then(async d => d.npc(gillieId, DialogueEmote.LAUGH_1, [`Tee hee! You've never milked a cow before, have you?`]))
            .then(async d => d.player(DialogueEmote.CALM_TALK_1, ['Erm... No. How could you tell?']))
            .then(async d => d.npc(gillieId, DialogueEmote.LAUGH_2, [`Because you're spilling milk all over the floor. What a`, 'waste! You need something to hold the milk.']))
            .then(async d => d.player(DialogueEmote.CONSIDERING, [`Ah yes, I really should have guessed that one, shouldn't`, 'I?']))
            .then(async d => d.npc(gillieId, DialogueEmote.LAUGH_2, [`You're from the city aren't you... Try it again with a`, `${emptyBucketItem.name.toLowerCase()}.`]))
            .then(async d => d.player(DialogueEmote.CALM_TALK_2, [`Right, I'll do that.`]))
            .then(d => {
                d.close();
            });
    }
}

export const actionItem: itemOnObjectActionHandler = (details) => milkCow(details);

export const actionInteract: objectInteractionActionHandler = (details) => milkCow(details);

export default {
    pluginId: 'rs:cow_milking',
    hooks: [
        {
            type: 'object_interaction',
            objectIds: objectIds.milkableCow,
            options: 'milk',
            walkTo: true,
            handler: actionInteract
        },
        {
            type: 'item_on_object',
            objectIds: objectIds.milkableCow,
            itemIds: itemIds.bucket,
            walkTo: true,
            handler: actionItem
        }
    ]
};
