import { npcInteractionActionHandler } from '@engine/world/action/npc-interaction.action';
import { dialogue, Emote } from '@engine/world/actor/dialogue';
import { questItems } from './romeo-and-juliet-quest.plugin';

export const draulLeptocDialogue: npcInteractionActionHandler[] = [
    async (details) => {
        const { player, npc } = details;
        const participants = [player, { npc, key: 'draul_leptoc' }];
        await dialogue(participants, [
            draul_leptoc => [Emote.ANGRY, `What are you doing here? Snooping around...`],
            player => [Emote.GENERIC, `Oh...just looking around...`],
            draul_leptoc => [Emote.ANGRY, `Just looking around! This is MY house! You might have at least 'ASKED' to view my considerably well appointed abode...but no, you've just burst in with all the elegance of a Troll at a tea party.`],
            player => [Emote.GENERIC, `I can see that you're busy ranting so I'll just nip off and investigate a bit.`]
        ]);
    },
    async (details) => {
        const { player, npc } = details;
        const participants = [player, { npc, key: 'draul_leptoc' }];
        await dialogue(participants, [
            draul_leptoc => [Emote.ANGRY, `What are you doing here? Snooping around... `],
            options => [
                `I've come to see Juliet on Romeo's behalf.`, [
                    player => [Emote.GENERIC, `I've come to see Juliet on Romeo's behalf.`],
                    draul_leptoc => [Emote.ANGRY, `What...what...Romeo! Why that good for nothing swine...he's always trying to get the affections of my daughter..that soppy, half brained nincompoop won't ever have the heart of my daughter.`],
                    draul_leptoc => [Emote.ANGRY, `She deserves someone of character, wit and repose.`],
                    player => [Emote.WONDERING, `What's so wrong about Romeo?`],
                    draul_leptoc => [Emote.ANGRY, `Wrong! What's wrong with him...have you actually talked to him? He's nothing but a dim witted upperclass twit, totally useless.`],
                    draul_leptoc => [Emote.ANGRY, `If he threw a stone at the ground, he'd probably miss! He's totally invisible when it's raining because he's so wet!`],
                    draul_leptoc => [Emote.ANGRY, `If you started with what's right with him, you'd have much less to consider!`],
                    player => [Emote.WONDERING, `Well, I admit, he's probably not the sharpest knife in the cutlery draw...`],
                    draul_leptoc => [Emote.ANGRY, `Sharp? I've seen keener wit in root vegetables. Anyway, stop changing the subject. Get out of here and don't think you can sneak up those stairs to see Juliet, because I'll catch you and then you'll be for it!`],
                    player => [Emote.WONDERING, `That seems a bit harsh....`],
                    draul_leptoc => [Emote.ANGRY, `Harsh but fair I think you'll find...now get OUT!`]
                ],
                `I've just come to have a chat with Juliet.`, [
                    player => [Emote.GENERIC, `I've just come to have a chat with Juliet.`],
                    draul_leptoc => [Emote.ANGRY, `What on earth about? I hope you're not in cahoots with that good for nothing Romeo!`],
                    player => [Emote.WONDERING, `Err..no of course not....why would I be?`],
                    draul_leptoc => [Emote.SKEPTICAL, `He's been trying to wooo my daughter for an age. Up until now she's had the good sense to just ignore him. I just don't know what's gotten into her recently so that she would give him the time of day.`],
                    player => [Emote.SHOCKED, `Well, love is mysterious! Perhaps one day someone may even learn to love you!`],
                    draul_leptoc => [Emote.ANGRY, `What! Someone may fall in love with me...what are you trying to insinuate?`],
                    player => [Emote.WONDERING, `Err...Nothing....I guess I'd better be going now...`]
                ],
                `Oh...just looking around...`, [
                    player => [Emote.GENERIC, `Oh...just looking around...`],
                    draul_leptoc => [Emote.ANGRY, `Just looking around! This is MY house! You might have at least 'ASKED' to view my considerably well appointed abode...but no, you've just burst in with all the elegance of a Troll at a tea party.`],
                    player => [Emote.GENERIC, `I can see that you're busy ranting so I'll just nip off and investigate a bit.`]
                ]
            ],
        ]);
    },
    async (details) => {
        const { player, npc } = details;
        const participants = [player, { npc, key: 'draul_leptoc' }];
        await dialogue(participants, [
            draul_leptoc => [Emote.ANGRY, `What are you doing in my house? Up to no good I shouldn't wonder!`],
            player => [Emote.GENERIC, `Just a small chore for Juliet, you do have a lovely daughter in her sir.`],
            draul_leptoc => [Emote.HAPPY, `Oh...why, thank you...I've always tried to my best...`],
            draul_leptoc => [Emote.ANGRY, ` ...Hang on! Enough of that smiley talk. I have a daughter and I know what she's like. Don't even think of carrying on anything behind my back, I have the eyes of a hawk, nothing gets past me!`]
        ]);

        if (!player.hasItemInInventory(questItems.julietLetter.gameId)) {
            return;
        }

        await dialogue(participants, [
            item => [questItems.julietLetter.gameId, `Sir Draul notices the message!`],
            draul_leptoc => [Emote.ANGRY, `Hey! What's that in your hands...looks like a message to me...with Juliet's barely legible scrawl on it...`],
            player => [Emote.SHOCKED, `Yes, yes, that's probably why I can't read it!`],
            player => [Emote.SHOCKED, `Sorry, I mean, that's right sir. I'm just popping to the shops to get some groceries for Juliet.`],
            player => [Emote.WONDERING, `Right, have to be off now...thanks...`],
            draul_leptoc => [Emote.ANGRY, `Groceries!`],
            draul_leptoc => [Emote.ANGRY, `Groceries!...at a time like this, does that girl know what she's putting me through!`]
        ]);
    },
];
