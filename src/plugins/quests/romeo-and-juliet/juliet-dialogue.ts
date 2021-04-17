import { dialogue, Emote } from '@engine/world/actor/dialogue';
import { questItems, questKey } from './romeo-and-juliet-quest.plugin';
import { QuestDialogueHandler } from '@engine/config/quest-config';
import { Player } from '@engine/world/actor/player/player';
import { Npc } from '@engine/world/actor/npc/npc';
import { findNpc } from '@engine/config';
import { getVarbitConfigId } from '@engine/util/varbits';

export const calculateJulietVisibility = (player: Player) => {
    const julietParentNpc = findNpc('rs:juliet:0');
    const configId = getVarbitConfigId(julietParentNpc.varbitId);

    const hideJulietForPlayer = player.getQuest(questKey).progress === 4 ? 1 : 0; // TODO fix this value
    player.outgoingPackets.updateClientConfig(configId, hideJulietForPlayer);
}

export const julietDialogueHandler: QuestDialogueHandler = {
    0: async (player: Player, npc: Npc) => {
        const participants = [player, { npc, key: 'juliet' }];
        await dialogue(participants, [
            juliet => [Emote.SAD, `Romeo, Romeo, wherefore art thou Romeo?`],
            text => `She seems to be lost in thought.`
        ]);
    },

    1: async (player: Player, npc: Npc) => {
        const participants = [player, { npc, key: 'juliet' }];
        await dialogue(participants, [
            player => [Emote.GENERIC, `Juliet, I come from Romeo. He begs me to tell you that he cares still.`],
            juliet => [Emote.HAPPY, `Oh how my heart soars to hear this news! Please take this message to him with great haste.`],
            player => [Emote.GENERIC, `Well, I hope it's good news...he was quite upset when I left him.`],
            juliet => [Emote.POMPOUS, `He's quite often upset...the poor sensitive soul. But I don't think he's going to take this news very well, however, all is not lost.`],
            juliet => [Emote.HAPPY, `Everything is explained in the letter, would you be so kind and deliver it to him please?`],
            player => [Emote.HAPPY, `Certainly, I'll do so straight away.`],
            juliet => [Emote.HAPPY, `Many thanks! Oh, I'm so very grateful. You may be our only hope.`]
        ]);

        const giveLetterSuccess = player.giveItem('rs:juliet_letter');
        if (giveLetterSuccess) {
            player.setQuestProgress('rs:romeo_and_juliet', 2);
            await dialogue(participants, [
                item => [questItems.julietLetter.gameId, `Juliet gives you a message.`]
            ]);
        } else {
            await dialogue(participants, [
                text => `You don't have enough space in your inventory!`
            ]);
        }
    },

    2: async (player: Player, npc: Npc) => {
        const participants = [player, { npc, key: 'juliet' }];

        const hasLetter = player.hasItemInInventory(questItems.julietLetter.gameId) || player.hasItemInBank(questItems.julietLetter.gameId);
        if (hasLetter) {
            await dialogue(participants, [
                player => [Emote.HAPPY, `Hello Juliet!`],
                juliet => [Emote.HAPPY, `Hello there...have you delivered the message to Romeo yet? What news do you have from my loved one?`],
                player => [Emote.SKEPTICAL, `Oh, sorry, I've not had chance to deliver it yet!`],
                juliet => [Emote.SAD, `Oh, that's a shame. I've been waiting so patiently to hear some word from him.`]
            ]);
        } else {
            await dialogue(participants, [
                player => [Emote.HAPPY, `Hello Juliet!`],
                juliet => [Emote.HAPPY, `Hello there...have you delivered the message to Romeo yet? What news do you have from my loved one?`],
                player => [Emote.SKEPTICAL, `Hmmm, that's the thing about messages...they're so easy to misplace...`],
                juliet => [Emote.SAD, `How could you lose that message? It was incredibly important...and it took me an age to write! I used joined up writing and everything!`],
                juliet => [Emote.SAD, `Please, take this new message to him, and please don't lose it.`]
            ]);

            const giveLetterSuccess = player.giveItem('rs:juliet_letter');
            if (giveLetterSuccess) {
                await dialogue(participants, [
                    item => [questItems.julietLetter.gameId, `Juliet gives you another message.`]
                ]);
            } else {
                await dialogue(participants, [
                    text => `You don't have enough space in your inventory!`
                ]);
            }
        }
    }
};
