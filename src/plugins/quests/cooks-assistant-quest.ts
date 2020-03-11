import { npcAction } from '@server/world/actor/player/action/npc-action';
import { ActionType, RunePlugin } from '@server/plugins/plugin';
import { npcIds } from '@server/world/config/npc-ids';
import { Quest } from '@server/world/config/quests';
import { dialogue, DialogueTree, Emote, execute, goto } from '@server/world/actor/dialogue';
import { Player } from '@server/world/actor/player/player';
import { Skill } from '@server/world/actor/skills';
import { itemIds } from '@server/world/config/item-ids';
import { QuestProgress } from '@server/world/actor/player/player-data';

const quest: Quest = {
    id: 'cooksAssistant',
    questTabId: 27,
    name: `Cook's Assistant`,
    points: 1,
    stages: {
        NOT_STARTED: `I can start this quest by speaking to the <col=800000>Cook</col> in the<br>` +
            `<col=800000>Kitchen</col> on the ground floor of <col=800000>Lumbridge Castle</col>.`,
        COLLECTING: (player: Player) => {
            let questLog = `It's the <col=800000>Duke of Lumbridge's</col> birthday and I have to help<br>` +
                `his <col=800000>Cook</col> make him a <col=800000>birthday cake.</col> To do this I need to<br>` +
                `bring him the following ingredients:<br>`;

            if(player.hasItemInInventory(itemIds.bucketOfMilk)) {
                questLog += `I have found a <col=800000>bucket of milk</col> to give to the cook.<br>`;
            } else {
                questLog += `I need to find a <col=800000>bucket of milk.</col> There's a cattle field east<br>` +
                    `of Lumbridge, I should make sure I take an empty bucket<br>`;
            }

            if(player.hasItemInInventory(itemIds.potOfFlour)) {
                questLog += `I have found a <col=800000>pot of flour</col> to give to the cook.<br>`;
            } else {
                questLog += `I need a <col=800000>pot of flour.</col> There's a mill found north-<br>` +
                    `west of Lumbridge, I should take an empty pot with me.<br>`;
            }

            if(player.hasItemInInventory(itemIds.egg)) {
                questLog += `I have found an <col=800000>egg</col> to give to the cook.`;
            } else {
                questLog += `I need to find an <col=800000>egg.</col> The cook normally gets his eggs from<br>` +
                    `the Groats' farm, found just to the west of the cattle<br>` +
                    `field.`;
            }

            return questLog;
        },
        COMPLETE: `<col=000000><str=000000>It was the Duke of Lumbridge's birthday, but his cook had</str></col><br>` +
                `<col=000000><str=000000>forgotten to buy the ingredients he needed to make him a</str></col><br>` +
                `<col=000000><str=000000>cake. I brought the cook an egg, some flour and some milk</str></col><br>` +
                `<col=000000><str=000000>and the cook made a delicious looking cake with them.</str></col><br>` +
                ` <br>` +
                `<col=000000><str=000000>As a reward he now lets me use his high quality range</str></col><br>` +
                `<col=000000><str=000000>which lets me burn things less whenever I wish to cook</str></col><br>` +
                `<col=000000><str=000000>there.</str></col><br>` +
                ` <br>` +
                `<col=ff0000>QUEST COMPLETE!</col>`
    },
    completion: {
        rewards: [ '300 Cooking XP' ],
        onComplete: (player: Player): void => {
            player.skills.addExp(Skill.COOKING, 300);
        },
        itemId: 1891,
        modelZoom: 240,
        modelRotationX: 180,
        modelRotationY: 180
    }
};

function dialogueIngredientQuestions(): Function {
    return (options, tag_INGREDIENT_QUESTIONS) => [
        `Where do I find some flour?`, [
            player => [ Emote.GENERIC, `Where do I find some flour?` ],
            cook => [ Emote.GENERIC, `There is a Mill fairly close, go North and then West. Mill Lane Mill ` +
            `is just off the road to Draynor. I usually get my flour from there.` ],
            cook => [ Emote.HAPPY, `Talk to Millie, she'll help, she's a lovely girl and a fine Miller.` ],
            goto('tag_INGREDIENT_QUESTIONS')
        ],
        `How about milk?`, [
            player => [ Emote.GENERIC, `How about milk?` ],
            cook => [ Emote.GENERIC, `There is a cattle field on the other side of the river, just across ` +
            `the road from Groats' Farm.` ],
            cook => [ Emote.HAPPY, `Talk to Gillie Groats, she look after the Dairy Cows - ` +
            `she'll tell you everything you need to know about milking cows!` ],
            goto('tag_INGREDIENT_QUESTIONS')
        ],
        `And eggs? Where are they found?`, [
            player => [ Emote.GENERIC, `And eggs? Where are they found?` ],
            cook => [ Emote.GENERIC, `I normally get my eggs from the Groats' farm, on the other side of ` +
            `the river.` ],
            cook => [ Emote.GENERIC, `But any chicken should lay eggs.` ],
            goto('tag_INGREDIENT_QUESTIONS')
        ],
        `Actually, I know where to find this stuff.`, [
            player => [ Emote.GENERIC, `I've got all the information I need. Thanks.` ]
        ]
    ];
}

const startQuestAction: npcAction = (details) => {
    const { player, npc } = details;

    dialogue([ player, { npc, key: 'cook' }], [
        cook => [ Emote.WORRIED, `What am I to do?` ],
        options => [
            `What's wrong?`, [],
            `Can you make me a cake?`, [
                player => [ Emote.HAPPY, `You're a cook, why don't you bake me a cake?` ],
                cook => [ Emote.SAD, `*sniff* Don't talk to me about cakes...` ]
            ],
            `You don't look very happy.`, [
                player => [ Emote.WORRIED, `You don't look very happy.` ],
                cook => [ Emote.SAD, `No, I'm not. The world is caving in around me - I am overcome by dark feelings ` +
                    `of impending doom.` ],
                options => [
                    `What's wrong?`, [],
                    `I'd take the rest of the day off if I were you.`, [
                        player => [ Emote.GENERIC, `I'd take the rest of the day off if I were you.` ],
                        cook => [ Emote.WORRIED, `No, that's the worst thing I could do. I'd get in terrible trouble.` ],
                        player => [ Emote.SKEPTICAL, `Well maybe you need to take a holiday...` ],
                        cook => [ Emote.SAD, `That would be nice, but the Duke doesn't allow holidays for core staff.` ],
                        player => [ Emote.LAUGH, `Hmm, why not run away to the sea and start a new life as a Pirate?` ],
                        cook => [ Emote.SKEPTICAL, `My wife gets sea sick, and I have an irrational fear of eyepatches. ` +
                            `I don't see it working myself.` ],
                        player => [ Emote.WORRIED, `I'm afraid I've run out of ideas.` ],
                        cook => [ Emote.SAD, `I know I'm doomed.` ]
                    ]
                ]
            ],
            `Nice hat!`, [
                player => [ Emote.HAPPY, `Nice hat!` ],
                cook => [ Emote.SKEPTICAL, `Err thank you. It's a pretty ordinary cooks hat really.` ],
                player => [ Emote.HAPPY, `Still, suits you. The trousers are pretty special too.` ],
                cook => [ Emote.SKEPTICAL, `It's all standard cook's issue uniform...` ],
                player => [ Emote.POMPOUS, `The whole hat, apron, striped trousers ensemble - it works. It makes you ` +
                    `look like a real cook.` ],
                cook => [ Emote.ANGRY, `I am a real cook! I haven't got time to be chatting about Culinary Fashion. ` +
                    `I am in desperate need of help!` ]
            ]
        ],
        player => [ Emote.HAPPY, `What's wrong?` ],
        cook => [ Emote.WORRIED, `Oh dear, oh dear, oh dear, I'm in a terrible terrible ` +
            ` mess! It's the Duke's birthday today, and I should be making him a lovely big birthday cake.` ],
        cook => [ Emote.WORRIED, `I've forgotten to buy the ingredients. I'll never get ` +
            `them in time now. He'll sack me! What will I do? I have four children and a goat to ` +
            `look after. Would you help me? Please?` ],
        options => [
            `I'm always happy to help a cook in distress.`, [
                execute(() => {
                    player.setQuestStage('cooksAssistant', 'COLLECTING');
                }),
                player => [ Emote.GENERIC, `Yes, I'll help you.` ],
                cook => [ Emote.HAPPY, `Oh thank you, thank you. I need milk, an egg and flour. I'd be very grateful ` +
                    `if you can get them for me.` ],
                player => [ Emote.GENERIC, `So where do I find these ingredients then?` ],
                dialogueIngredientQuestions()
            ],
            `I can't right now, maybe later.`, [
                player => [ Emote.GENERIC, `No, I don't feel like it. Maybe later.` ],
                cook => [ Emote.ANGRY, `Fine. I always knew you Adventurer types were callous beasts. ` +
                    `Go on your merry way!` ]
            ]
        ]
    ]).catch(error => console.error(error));
};

function youStillNeed(quest: QuestProgress) {
    return [
        text => `You still need to get\n` +
            `${!quest.attributes.givenMilk ? `A bucket of milk. `: ``}${!quest.attributes.givenFlour ? `A pot of flour. ` : ``}${!quest.attributes.givenEgg ? `An egg.` : ``}`,
        options => [
            `I'll get right on it.`, [
                player => [Emote.GENERIC, `I'll get right on it.`]
            ],
            `Can you remind me how to find these things again?`, [
                player => [Emote.GENERIC, `So where do I find these ingredients then?`],
                dialogueIngredientQuestions()
            ]
        ]
    ];
}

const handInIngredientsAction: npcAction = (details) => {
    const { player, npc } = details;

    const dialogueTree: DialogueTree = [
        cook => [Emote.GENERIC, `How are you getting on with finding the ingredients?`]
    ];

    const quest = player.quests.find(quest => quest.questId === 'cooksAssistant');

    const ingredients = [
        { itemId: itemIds.bucketOfMilk, text: `Here's a bucket of milk.`, attr: 'givenMilk' },
        { itemId: itemIds.potOfFlour, text: `Here's a pot of flour.`, attr: 'givenFlour' },
        { itemId: itemIds.egg, text: `Here's a fresh egg.`, attr: 'givenEgg' }
    ];

    for(const ingredient of ingredients) {
        if(quest.attributes[ingredient.attr]) {
            quest.attributes.ingredientCount++;
            continue;
        }

        if(!player.hasItemInInventory(ingredient.itemId)) {
            continue;
        }

        dialogueTree.push(
            player => [Emote.GENERIC, ingredient.text],
            execute(() => {
                const quest = player.quests.find(quest => quest.questId === 'cooksAssistant');

                if(player.removeFirstItem(ingredient.itemId) !== -1) {
                    quest.attributes[ingredient.attr] = true;
                }
            })
        );
    }

    dialogueTree.push(
        goto(() => {
            const count = [ quest.attributes.givenMilk, quest.attributes.givenFlour, quest.attributes.givenEgg ]
                .filter(value => value === true).length;

            console.log(count);

            if(count === 3) {
                return 'tag_ALL_INGREDIENTS';
            } else if(count === 0) {
                return 'tag_NO_INGREDIENTS';
            } else {
                return 'tag_SOME_INGREDIENTS';
            }
        })
    );

    dialogueTree.push((subtree, tag_ALL_INGREDIENTS) => [
        cook => [Emote.HAPPY, `You've brought me everything I need! I am saved! Thank you!`],
        player => [Emote.WONDERING, `So do I get to go to the Duke's Party?`],
        cook => [Emote.SAD, `I'm afraid not, only the big cheeses get to dine with the Duke.`],
        player => [Emote.GENERIC, `Well, maybe one day I'll be important enough to sit on the Duke's table.`],
        cook => [Emote.SKEPTICAL, `Maybe, but I won't be holding my breath.`],
        execute(() => {
            player.setQuestStage('cooksAssistant', 'COMPLETE');
        })
    ]);

    dialogueTree.push((subtree, tag_NO_INGREDIENTS) => [
        player => [Emote.GENERIC, `I haven't got any of them yet, I'm still looking.`],
        cook => [Emote.SAD, `Please get the ingredients quickly. I'm running out of time! ` +
        `The Duke will throw me into the streets!`],
        ...youStillNeed(quest)
    ]);

    dialogueTree.push((subtree, tag_SOME_INGREDIENTS) => [
        cook => [Emote.SAD, `Thanks for the ingredients you have got so far, please get the rest quickly. ` +
        `I'm running out of time! The Duke will throw me into the streets!`],
        ...youStillNeed(quest)
    ]);

    dialogue([ player, { npc, key: 'cook' }], dialogueTree);
};

// @TODO quest journal auto new-line?

export default new RunePlugin([{
    type: ActionType.QUEST,
    quest
}, {
    type: ActionType.NPC_ACTION,
    questAction: { questId: 'cooksAssistant', stage: 'NOT_STARTED' },
    npcIds: npcIds.lumbridgeCook,
    options: 'talk-to',
    walkTo: true,
    action: startQuestAction
}, {
    type: ActionType.NPC_ACTION,
    questAction: { questId: 'cooksAssistant', stage: 'COLLECTING' },
    npcIds: npcIds.lumbridgeCook,
    options: 'talk-to',
    walkTo: true,
    action: handInIngredientsAction
}]);
