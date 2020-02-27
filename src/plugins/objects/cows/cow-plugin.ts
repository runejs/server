import { objectAction } from '@server/world/actor/player/action/object-action';
import { gameCache, world } from '@server/game-server';
import { ActionType, RunePlugin } from '@server/plugins/plugin';
import { dialogueAction, DialogueEmote } from '@server/world/actor/player/action/dialogue-action';
import { Npc } from '@server/world/actor/npc/npc';


export const action: objectAction = (details) => {
    const {player, option, objectDefinition, object} = details;
    const emptyBucketItem = gameCache.itemDefinitions.get(1925);
    const milkBucketItem = gameCache.itemDefinitions.get(1927);

    if(player.hasItemInInventory(emptyBucketItem.id)) {
        player.playAnimation(2305);
        player.outgoingPackets.playSound(372, 7);
        player.removeFirstItem(emptyBucketItem.id);
        player.giveItem(milkBucketItem.id);
        player.outgoingPackets.chatboxMessage(`You ${option} the ${objectDefinition.name} and receive some milk.`);
    } else {
        dialogueAction(player)
            .then(d => d.npc(3807, DialogueEmote.LAUGH_1, [`Tee hee! You've never milked a cow before, have you?`]))
            .then(d => d.player(DialogueEmote.CALM_TALK_1, ['Erm... No. How could you tell?']))
            .then(d => d.npc(3807, DialogueEmote.LAUGH_2, [`Because you're spilling milk all over the floor. What a`, 'waste! You need something to hold the milk.']))
            .then(d => d.player(DialogueEmote.CONSIDERING, [`Ah yes, I really should have guessed that one, shouldn't`, 'I?']))
            .then(d => d.npc(3807, DialogueEmote.LAUGH_2, [`You're from the city aren't you... Try it again with a`, `${emptyBucketItem.name.toLowerCase()}.`]))
            .then(d => d.player(DialogueEmote.CALM_TALK_2, [`Right, I'll do that.`]))
            .then(d => {
                d.close();
            });
    }
};

export default new RunePlugin({
    type: ActionType.OBJECT_ACTION,
    objectIds: [8689],
    options: ['milk'],
    walkTo: true,
    action
});
