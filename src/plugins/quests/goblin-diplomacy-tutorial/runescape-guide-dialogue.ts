import type { QuestDialogueHandler } from '@engine/config/quest-config';
import { Emote, dialogue, execute } from '@engine/world/actor/dialogue';
import type { Player } from '@engine/world/actor/player/player';
import { defaultPlayerTabWidgets } from '@engine/world/actor/player/player';
import { updateCombatStyleWidget } from '@plugins/combat/combat-styles.plugin';

export const runescapeGuideDialogueHandler: QuestDialogueHandler = {
    5: async (player: Player, npc) => {
        await dialogue(
            [player, { npc, key: 'guide' }],
            [
                _guide => [Emote.GENERIC, 'Greetings adventurer, welcome to RuneScape.'],
                _player => [Emote.SKEPTICAL, 'How did I get here?...'],
                _guide => [Emote.GENERIC, 'Seems like a goblin smacked you over the head on your way in. Nasty little things.'],
                _player => [Emote.DROWZY, 'I guess that explains the headache.'],
                _guide => [Emote.GENERIC, `I would imagine so. Now, it's my job here is to show new players around.`],
                _options => [
                    'Go on.',
                    [
                        _player => [Emote.GENERIC, 'Carry on then.'],
                        _guide => [
                            Emote.GENERIC,
                            `We'll start with the Options menu. Click on the blinking spanner icon at the bottom right of your game screen.`,
                        ],
                        execute(() => {
                            player.setQuestProgress('tyn:goblin_diplomacy', 10);
                        }),
                    ],
                    'I know how the game works already.',
                    [
                        _player => [Emote.HAPPY, `This isn't my first time here, I'm good.`],
                        _guide => [Emote.HAPPY, `Oh good, I won't tell you what you already know then.`],
                        execute(() => {
                            player.savedMetadata.tutorialComplete = true;
                            player.setQuestProgress('tyn:goblin_diplomacy', 'complete');
                            player.instance = null;
                            defaultPlayerTabWidgets().forEach((widgetId: number, tabIndex: number) => {
                                if (widgetId !== -1) {
                                    player.setSidebarWidget(tabIndex, widgetId);
                                }
                            });
                            updateCombatStyleWidget(player);
                            player.metadata.blockObjectInteractions = false;
                        }),
                    ],
                ],
            ],
        );
    },
    10: async (player, npc) => {
        await dialogue(
            [player, { npc, key: 'guide' }],
            [_guide => [Emote.GENERIC, 'Please click on the blinking spanner icon, then we can continue.']],
        );
    },
    15: async (player, npc) => {
        await dialogue(
            [player, { npc, key: 'guide' }],
            [
                _guide => [
                    Emote.HAPPY,
                    `Next we'll move on to the more social side of things. Click on the blinking icon to learn about the Friends List.`,
                ],
                execute(() => {
                    player.setQuestProgress('tyn:goblin_diplomacy', 20);
                }),
            ],
        );
    },
    20: async (player, npc) => {
        await dialogue(
            [player, { npc, key: 'guide' }],
            [_guide => [Emote.GENERIC, `Please return to me once you've gone through all three social tabs.`]],
        );
    },
    25: async (player, npc) => {
        await dialogue(
            [player, { npc, key: 'guide' }],
            [_guide => [Emote.GENERIC, `Please return to me once you've gone through all three social tabs.`]],
        );
    },
    30: async (player, npc) => {
        await dialogue(
            [player, { npc, key: 'guide' }],
            [_guide => [Emote.GENERIC, `Please return to me once you've gone through all three social tabs.`]],
        );
    },
    35: async (player, npc) => {
        await dialogue(
            [player, { npc, key: 'guide' }],
            [
                _player => [Emote.HAPPY, `I've gone through the Friends List and everything. When do I get to kill things?`],
                _guide => [Emote.LAUGH, `All in good time, ${player.username}. We've a little more to discuss yet - like music!`],
                _player => [Emote.SKEPTICAL, `Music? Doesn't everyone turn that off?`],
                _guide => [Emote.SAD, 'Some people find it nostalgic.'],
                _player => [Emote.SAD, 'Sorry, go on...'],
                _guide => [Emote.GENERIC, 'Yes... As I was saying... Music can be accessed from the music tab.'],
                execute(() => {
                    player.setQuestProgress('tyn:goblin_diplomacy', 40);
                }),
            ],
        );
    },
    45: async (player, npc) => {
        await dialogue(
            [player, { npc, key: 'guide' }],
            [
                _player => [Emote.HAPPY, `That music tab is pretty nostalgic, I'll give ya that.`],
                _guide => [Emote.LAUGH, `Isn't it? Sometimes I can hear Harmony in my sleep.`],
                _player => [Emote.WONDERING, `So what's next?`],
                _guide => [Emote.GENERIC, `Next you'll be moving on to my friend Harlan, to learn about your inventory and skills.`],
                _player => [Emote.HAPPY, 'So I finally get to kill something?'],
                _guide => [Emote.SAD, `That's all you adventurers ever want to do...`],
                _guide => [
                    Emote.GENERIC,
                    `Oh well. Head on over to Harlan, the melee combat tutor, and I'm sure he'll show you how to kill something.`,
                ],
                execute(() => {
                    player.setQuestProgress('tyn:goblin_diplomacy', 50);
                }),
            ],
        );
    },
    50: async (player, npc) => {
        await dialogue(
            [player, { npc, key: 'guide' }],
            [_guide => [Emote.GENERIC, 'Please speak to my friend Harlan, the melee combat tutor, to continue.']],
        );
    },
};
