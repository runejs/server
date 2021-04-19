import { dialogue, Emote, goto } from '@engine/world/actor/dialogue';
import { QuestDialogueHandler } from '@engine/config/quest-config';
import { Player } from '@engine/world/actor/player/player';
import { Npc } from '@engine/world/actor/npc/npc';
import { Cutscene } from '@engine/world/actor/player/cutscenes';

export const lawrenceOptions = () => {
    return (options, tag_OPTIONS) => [
        `I am always looking for a quest.`, [
            player => [Emote.HAPPY, `I am always looking for a quest.`],
            lawrence => [Emote.GENERIC, `Well, I see poor Romeo wandering around the square. I think he may need help.`],
            lawrence => [Emote.SAD, `I was helping him and Juliet to meet, but it became impossible.`],
            lawrence => [Emote.HAPPY, `I am sure he can use some help.`],
            goto('tag_OPTIONS')
        ],
        `No, I prefer just to kill things.`, [
            player => [Emote.HAPPY, `No, I prefer just to kill things.`],
            lawrence => [Emote.HAPPY, `That's a fine career in these lands. There is more that needs killing every day.`],
            goto('tag_OPTIONS')
        ],
        `Can you recommend a good bar?`, [
            player => [Emote.GENERIC, `Can you recommend a good bar?`],
            lawrence => [Emote.ANGRY, `Drinking will be the death of you.`],
            lawrence => [Emote.GENERIC, `But the Blue Moon in the city is cheap enough.`],
            lawrence => [Emote.HAPPY, `And providing you buy one drink an hour they let you stay all night.`],
            goto('tag_OPTIONS')
        ],
        `Ok, thanks`, [
            player => [Emote.GENERIC, `Ok, thanks`]
        ]
    ];
};

export const lawrenceDialogueHandler: QuestDialogueHandler = {
    0: async (player: Player, npc: Npc) => {
        const participants = [player, { npc, key: 'lawrence' }];
        await dialogue(participants, [
            lawrence => [Emote.GENERIC, `Hello adventurer, do you seek a quest?`],
            lawrenceOptions()
        ]);
    },
    1: 0,
    2: 0,

    3: async (player: Player, npc: Npc) => {
        const participants = [player, { npc, key: 'lawrence' }];
        await dialogue(participants, [
            lawrence => [Emote.HAPPY, `''...and let Saradomin light the way for you... '' Urgh!`],
            lawrence => [Emote.ANGRY, `Can't you see that I'm in the middle of a Sermon?!`],
            player => [Emote.ANGRY, `But Romeo sent me!`],
            lawrence => [Emote.ANGRY, `But I'm busy delivering a sermon to my congregation!`],
        ]);

        player.cutscene = new Cutscene(player, { hideTabs: false, hideMinimap: false });
        player.cutscene.snapCameraTo(3254, 3486, 330);
        player.cutscene.lookAt(3255, 3479, 300);

        const congregation = [player, { npc: 'rs:jeremy_clerksin', key: 'congregation' }]
        await dialogue(congregation, [
            congregation => [Emote.SLEEPING, `Zzzzzzzzz`, `Congregation`],
            player => [Emote.ANGRY, `Yes, well, it certainly seems like you have a captive audience!`]
        ]);

        player.cutscene.endCutscene();

        await dialogue(participants, [
            lawrence => [Emote.HAPPY, `Ok, ok...what do you want so I can get rid of you and continue with my sermon?`]
        ]);

        // TODO
    },
};
