import { npcInteractionActionHandler } from '@engine/world/action/npc-interaction.action';
import { dialogue, Emote, goto } from '@engine/world/actor/dialogue';

export const lawrenceOptions = () => {
    return (options, tag_OPTIONS) => [
        `I am always looking for a quest.`, [
            player => [Emote.HAPPY, `I am always looking for a quest.`],
            father_lawrence => [Emote.GENERIC, `Well, I see poor Romeo wandering around the square. I think he may need help.`],
            father_lawrence => [Emote.SAD, `I was helping him and Juliet to meet, but it became impossible.`],
            father_lawrence => [Emote.HAPPY, `I am sure he can use some help.`],
            goto('tag_OPTIONS')
        ],
        `No, I prefer just to kill things.`, [
            player => [Emote.HAPPY, `No, I prefer just to kill things.`],
            father_lawrence => [Emote.HAPPY, `That's a fine career in these lands. There is more that needs killing every day.`],
            goto('tag_OPTIONS')
        ],
        `Can you recommend a good bar?`, [
            player => [Emote.GENERIC, `Can you recommend a good bar?`],
            father_lawrence => [Emote.ANGRY, `Drinking will be the death of you.`],
            father_lawrence => [Emote.GENERIC, `But the Blue Moon in the city is cheap enough.`],
            father_lawrence => [Emote.HAPPY, `And providing you buy one drink an hour they let you stay all night.`],
            goto('tag_OPTIONS')
        ],
        `Ok, thanks`, [
            player => [Emote.GENERIC, `Ok, thanks`]
        ]
    ];
}

export const fatherLawrenceDialogue: npcInteractionActionHandler[] = [
    async (details) => {
        const { player, npc } = details;
        const participants = [player, { npc, key: 'father_lawrence' }];
        await dialogue(participants, [
            father_lawrence => [Emote.GENERIC, `Hello adventurer, do you seek a quest?`],
            lawrenceOptions()
        ]);
    },
    async details => {
        const { player, npc } = details;
        const participants = [player, { npc, key: 'father_lawrence' }];
        await dialogue(participants, [

        ]);
    }
];
