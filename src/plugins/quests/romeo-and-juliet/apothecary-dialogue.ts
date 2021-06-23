import { dialogue, Emote, goto } from '@engine/world/actor/dialogue';
import { QuestDialogueHandler } from '@engine/config/quest-config';
import { Player } from '@engine/world/actor/player/player';
import { Npc } from '@engine/world/actor/npc/npc';

export const apothecaryOptions = (player: Player) => {
    return (options, tag_OPTIONS) => {
        const firstOption = [`Have you got any decent gossip to share?`, [
            player => [Emote.POMPOUS, `Have you got any decent gossip to share?`],
            apothecary => [Emote.GENERIC, `Well I hear young Romeo's having a little woman trouble but other than that all's quiet on the eastern front. Can I do something for you?`],
            goto('tag_OPTIONS')
        ]];

        const restOptions = [
            `Do you know a potion to make hair fall out?`, [
                player => [Emote.HAPPY, `Do you know a potion to make hair fall out?`],
                apothecary => [Emote.HAPPY, `I do indeed. I gave it to my mother. That's why I now live alone.`],
                apothecary => [Emote.GENERIC, `But can I do something for you?`],
                goto('tag_OPTIONS')
            ],
            `Have you got any good potions to give away?`, [
                player => [Emote.HAPPY, `Have you got any good potions to give away?`],
                apothecary => [Emote.SAD, `Sorry, charity is not my strong point. Do you need anything else?`],
                goto('tag_OPTIONS')
            ],
            `No thanks.`, [
                player => [Emote.VERY_SAD, `No thanks.`]
            ]
        ];

        return [...firstOption, ...restOptions];
    };
};

export const apothecaryDialogueHandler: QuestDialogueHandler = {
    0: async (player: Player, npc: Npc) => {
        const participants = [player, { npc, key: 'apothecary' }];
        await dialogue(participants, [
            apothecary => [Emote.GENERIC, `I am the Apothecary. I brew potions. Do you need anything specific?`],
            apothecaryOptions(player)
        ]);
    },
    1: 0,
    2: 0,
    3: 0
};
