import { npcInteractionActionHandler } from '@engine/action/pipe/npc-interaction.action';
import { dialogue, DialogueTree, Emote, execute, goto } from '@engine/world/actor/dialogue';
import { itemIds } from '@engine/world/config/item-ids';
import { QuestJournalHandler } from '@engine/config/quest-config';
import { Player } from '@engine/world/actor/player/player';
import { Quest } from '@engine/world/actor/player/quest';
import { objectInteractionActionHandler } from '@engine/action/pipe/object-interaction.action';
import { Position } from '@engine/world/position';


const journalHandler: QuestJournalHandler = {

    0: `<col=000080>I can start this quest by speaking to <col=800000>Hetty<col=000080> in her house in
<col=800000>Rimmington<col=000080>, West of <col=800000>Port Sarim`,

    50: player => {
        let questLog = `<str><col=000000>I spoke to Hetty in her house at Rimmington. Hetty told me</str>
        <str>she could increase my magic power if I can bring her</str>
        <str>certain ingredients for a potion.</str>
        <col=000080>Hetty needs me to bring her the following:`;

        const questLogIngredientData = [
            {
                itemId: itemIds.witchesPotion.ratsTail,
                haveText: `<str><col=000000>I have a rat's tail with me,</str>`,
                dontHaveText: `<col=800000>A rat's tail<col=000080>, I could get one from a small rat.`
            },
            {
                itemId: itemIds.witchesPotion.burntMeat,
                haveText: `<str><col=000000>I have a piece of burnt meat with me,</str>`,
                dontHaveText: `<col=800000>A piece of burnt meat<col=000080>, I could thoroughly cook a piece of
        <col=000080>raw beef.`
            },
            {
                itemId: itemIds.witchesPotion.onion,
                haveText: `<str><col=000000>I have an onion with me,</str>`,
                dontHaveText: `<col=800000>An onion<col=000080>, I could probably find one at a farm.`
            },
            {
                itemId: itemIds.witchesPotion.eyeOfNewt,
                haveText: `<str><col=000000>I have an eye of newt with me,</str>`,
                dontHaveText: `<col=800000>An eye of newt<col=000080>, maybe the <col=800000>Magic shop<col=000080> in <col=800000>Port Sarim<col=000080> would
        <col=000080>sell me this?`
            }
        ];

        let ingredientsObtained = 0;
        for (const ingredient of questLogIngredientData) {
            questLog += `\n`
            if (player.hasItemInInventory(ingredient.itemId)) {
                questLog += ingredient.haveText;
                ingredientsObtained++;
            } else {
                questLog += ingredient.dontHaveText
            }
        }

        if(ingredientsObtained === 4) {
            questLog += `\n<col=000080>I should bring these ingredients to <col=800000>Hetty<col=000080>.`
        }

        return questLog;
    },

    75: `<col=000000><str>I brought her an onion, a rat's tail, a piece of burnt meat</str>
    <str>and an eye of newt which she used to make a potion.</str>
    <col=000080>I should drink from the <col=800000>cauldron<col=000080> and improve my magic!`,


    'complete': `<col=000000><str>I brought her an onion, a rat's tail, a piece of burnt meat
        <str>and an eye of newt which she used to make a potion.\n
        <str>I drank from the cauldron and my magic power increased!\n
        <col=ff0000>QUEST COMPLETE!</col>`,

};

const drinkThePotionDialogue: npcInteractionActionHandler = (details) => {
    const { player, npc } = details;

    player.face(npc);
    dialogue([player, { npc, key: 'hetty' }], [
        hetty => [Emote.ANGRY, `Well are you going to drink the potion or not?`],
        player => [Emote.GENERIC, `Yes, I will.`]
    ]);
}

const drinkFromCauldron: objectInteractionActionHandler = async (details) => {
    const { player, object } = details;

    let questComplete = false;
    player.face(new Position(object.x, object.y))
    await dialogue([player], [
        text => (`You drink from the cauldron. It tastes horrible!\nYou feel yourself imbued with power.`),
        execute(() => {
            questComplete = true;
        })
    ]);

    if (questComplete) {
        player.setQuestProgress('rs:witchs_potion', `complete`);
    }
}

const attemptToDrinkBeforeAllowed: objectInteractionActionHandler = async (details) => {
    const { player, object } = details;
    player.face(new Position(object.x, object.y))
    await dialogue([player], [
        player => [Emote.GENERIC, `As nice as that looks I think I'll give it a miss for now.`]
    ]);
}


const dialogueIngredientQuestions: npcInteractionActionHandler = (details) => {
    const { player, npc } = details;

    const hasRatsTail = player.hasItemInInventory(itemIds.witchesPotion.ratsTail);
    const hasBurntMeat = player.hasItemInInventory(itemIds.witchesPotion.burntMeat);
    const hasOnion = player.hasItemInInventory(itemIds.witchesPotion.onion);
    const hasEyeOfNewt = player.hasItemInInventory(itemIds.witchesPotion.eyeOfNewt);

    const ingredients = [
        {
            itemId: itemIds.witchesPotion.ratsTail,
            haveText: `I have the rat's tail (ewww), `,
            dontHaveText: `I don't have a rat's tail, `
        },
        {
            itemId: itemIds.witchesPotion.burntMeat,
            haveText: `I have the burnt meat, `,
            dontHaveText: `I don't have any burnt meat, `
        },
        {
            itemId: itemIds.witchesPotion.onion,
            haveText: `I have an onion, and `,
            dontHaveText: `I don't have an onion, and `
        },
        {
            itemId: itemIds.witchesPotion.eyeOfNewt,
            haveText: `I have the eye of newt, yum!`,
            dontHaveText: `I don't have an eye of newt.`
        }
    ];


    let requirementsDialogue = ``;
    for (const ingredient of ingredients) {
        if (player.hasItemInInventory(ingredient.itemId)) {
            requirementsDialogue += ingredient.haveText;
        } else {
            requirementsDialogue += ingredient.dontHaveText
        }
    }


    dialogue([player, { npc, key: 'hetty' }], [
        goto(() => {
            const count = [hasRatsTail, hasEyeOfNewt, hasOnion, hasBurntMeat]
                .filter(value => value === true).length;
            if (count === 4) {
                return 'tag_ALL_INGREDIENTS';
            } else if (count === 0) {
                return 'tag_NO_INGREDIENTS';
            } else {
                return 'tag_SOME_INGREDIENTS';
            }
        }),
        (subtree, tag_ALL_INGREDIENTS) => [
            hetty => [Emote.HAPPY, `So have you found the things for the potion?`],
            player => [Emote.HAPPY, `Yes I have everything!`],
            hetty => [Emote.HAPPY, `Excellent, can I have them then?`],
            (text, tag_has_ingredients) => (`You pass the ingredients to Hetty and she puts them all into her cauldron. Hetty closes her eyes and begins to chant. The cauldron bubbles mysteriously.`),
            player => [Emote.GENERIC, `Well, is it ready?`],
            execute(() => {
                player.removeFirstItem(itemIds.witchesPotion.ratsTail);
                player.removeFirstItem(itemIds.witchesPotion.onion)
                player.removeFirstItem(itemIds.witchesPotion.burntMeat);
                player.removeFirstItem(itemIds.witchesPotion.eyeOfNewt);
                player.setQuestProgress(`rs:witchs_potion`, 75);
            }),
            hetty => [Emote.HAPPY, `Ok, now drink from the cauldron.`],
        ],
        (subtree, tag_NO_INGREDIENTS) => [
            player => [Emote.HAPPY, `I've been looking for those ingredients.`],
            hetty => [Emote.HAPPY, `So what have you found so far?`],
            player => [Emote.GENERIC, `I'm afraid I don't have any of them yet.`],
            hetty => [Emote.SAD, `Well I can't make the potion without them! Remember... You need an eye of newt, a rat's tail, an onion, and a piece of burnt meat. Off you go dear!`],
        ],
        (subtree, tag_SOME_INGREDIENTS) => [
            player => [Emote.HAPPY, `I've been looking for those ingredients.`],
            hetty => [Emote.HAPPY, `So what have you found so far?`],
            player => [Emote.GENERIC, requirementsDialogue],
            hetty => [Emote.GENERIC, `Great, but I'll need the other ingredients as well.`],
        ]
    ]);
}


const afterQuestDialogue: npcInteractionActionHandler = (details) => {
    const { player, npc } = details;
    player.face(npc);


    dialogue([player, { npc, key: 'hetty' }], [
        hetty => [Emote.HAPPY, `How's your magic coming along?`],
        player => [Emote.HAPPY, `I'm practicing and slowly getting better.`],
        hetty => [Emote.HAPPY, `Good, good.`],
    ]);
}

const startQuestAction: npcInteractionActionHandler = async (details) => {
    const { player, npc } = details;
    player.face(npc);
    npc.face(player);
    let beginQuest = false;
    await dialogue([player, { npc, key: 'hetty' }], [
        hetty => [Emote.WONDERING, 'What could you want with an old woman like me?'],
        options => [
            `I am in search of a quest.`, [
                (player, tag_search_of_quest) => [Emote.GENERIC, `I am in search of a quest.`],
                hetty => [Emote.HAPPY, `Hmmm... Maybe I can think of something for you.`],
                hetty => [Emote.HAPPY, `Would you like to become more proficient in the dark arts?`],

                options => [
                    `Yes, help me become one with my darker side.`, [
                        player => [Emote.HAPPY, `Yes, help me become one with my darker side.`],
                        goto(`tag_darker_side`)
                    ],
                    `No, I have my principles and honour.`, [
                        player => [Emote.GENERIC, `No, I have my principles and honour.`],
                        hetty => [Emote.SAD, `Suit yourself, but you're missing out.`]
                    ],
                    `What, you mean improve my magic?`, [
                        player => [Emote.SAD, 'What, you mean improve my magic?'],
                        text => (`The witch sighs.`),
                        hetty => [Emote.GENERIC, 'Yes, improve your magic...'],
                        hetty => [Emote.SAD, 'Do you have no sense of drama?'],
                        options => [
                            `Yes, I'd like to improve my magic.`, [
                                player => [Emote.GENERIC, `Yes, I'd like to improve my magic.`],
                                (hetty, tag_darker_side) => [Emote.HAPPY, `Okay, I'm going to make a potion to help bring out your darker self.`],
                                hetty => [Emote.GENERIC, `You will need certain ingredients.`],
                                player => [Emote.GENERIC, `What do I need?`],
                                execute(() => {
                                    beginQuest = true;
                                }),
                                hetty => [Emote.WONDERING, `You need an eye of newt, a rat's tail, an onion... Oh and a piece of burnt meat.`],
                                player => [Emote.HAPPY, `Great, I'll go and get them.`],
                            ],
                            `No, I'm not interested.`, [
                                player => [Emote.SAD, `No, I'm not interested.`],
                                hetty => [Emote.SAD, `Many aren't to start off with.`],
                                text => (`The witch smiles mysteriously.`),
                                hetty => [Emote.GENERIC, `But I think you'll be drawn back to this place.`]
                            ],
                            `Show me the mysteries of the dark arts...`, [
                                player => [Emote.GENERIC, `Show me the mysteries of the dark arts...`],
                                goto(`tag_darker_side`)
                            ]
                        ],
                    ]
                ],
            ],
            `I've heard that you are a witch.`, [
                player => [Emote.HAPPY, `I've heard that you are a witch.`],
                hetty => [Emote.HAPPY, `Yes it does seem to be getting fairly common knowledge.`],
                hetty => [Emote.WORRIED, `I fear I may get a visit from the witch hunters of Falador before long.`],
                options => [
                    `I am in search of a quest.`, [
                        goto('tag_search_of_quest')
                    ],
                    `Goodbye.`, [
                        player => [Emote.VERY_SAD, `Goodbye.`]
                    ]
                ]
            ]
        ]
    ])
    if (beginQuest) {
        player.setQuestProgress('rs:witchs_potion', 50);
    }
};

export default {
    pluginId: 'rs:witchs_potion_quest',
    quests: [
        new Quest({
            id: 'rs:witchs_potion',
            questTabId: 42,
            name: `Witch's Potion`,
            points: 1,
            journalHandler,
            onComplete: {
                questCompleteWidget: {
                    rewardText: ['325 Magic XP'],
                    itemId: 221,
                    modelZoom: 240,
                    modelRotationX: 180,
                    modelRotationY: 180
                },
                giveRewards: (player: Player): void =>
                    player.skills.magic.addExp(325)
            }
        })
    ],
    hooks: [
        {
            type: 'npc_interaction',
            npcs: 'rs:hetty',
            options: 'talk-to',
            walkTo: true,
            handler: startQuestAction
        },
        {
            type: 'npc_interaction',
            questRequirement: {
                questId: 'rs:witchs_potion',
                stage: 50
            },
            npcs: 'rs:hetty',
            options: 'talk-to',
            walkTo: true,
            handler: dialogueIngredientQuestions
        },
        {
            type: 'npc_interaction',
            questRequirement: {
                questId: 'rs:witchs_potion',
                stage: 75
            },
            npcs: 'rs:hetty',
            options: 'talk-to',
            walkTo: true,
            handler: drinkThePotionDialogue
        },
        {
            type: 'npc_interaction',
            questRequirement: {
                questId: 'rs:witchs_potion',
                stage: 'complete'
            },
            npcs: 'rs:hetty',
            options: 'talk-to',
            walkTo: true,
            handler: afterQuestDialogue
        },
        {
            type: 'object_interaction',
            objectIds: 2024,
            questRequirement: {
                questId: 'rs:witchs_potion',
                stage: 75
            },
            options: 'drink from',
            walkTo: true,
            handler: drinkFromCauldron
        },
        {
            type: 'object_interaction',
            objectIds: 2024,
            options: 'drink from',
            walkTo: true,
            handler: attemptToDrinkBeforeAllowed
        }
    ]
};
