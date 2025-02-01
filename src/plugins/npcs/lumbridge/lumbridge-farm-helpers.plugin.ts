import type { npcInteractionActionHandler } from '@engine/action/pipe/npc-interaction.action';
import { Emote, dialogue, goto } from '@engine/world/actor/dialogue';

const millieDialogue: npcInteractionActionHandler = async details =>
    dialogue(
        [details.player, { npc: details.npc, key: 'millie' }],
        [
            _millie => [Emote.GENERIC, 'Hello Adventurer. Welcome to Mill Lane Mill. Can I help you?'],
            _options => [
                'Who are you?',
                [
                    _player => [Emote.WONDERING, 'Who are you?'],
                    _millie => [
                        Emote.HAPPY,
                        `I'm Miss Millicent Miller the Miller of Mill Lane Mill. ` + 'Our family have been milling flour for generations.',
                    ],
                    _player => [Emote.GENERIC, `It's a good business to be in. People will always need flour.`],
                    goto('tag_Mill_Flour'),
                ],
                'What is this place?',
                [
                    _player => [Emote.WONDERING, 'What is this place?'],
                    _millie => [
                        Emote.HAPPY,
                        'This is Mill Lane Mill. Millers of the finest flour in Gielinor, ' +
                            'and home to the Miller family for many generations.',
                    ],
                    _millie => [Emote.GENERIC, 'We take grain from the field nearby and mill into flour.'],
                    goto('tag_Mill_Flour'),
                ],
                'How do I mill flour?',
                [
                    (_player, _tag_Mill_Flour) => [Emote.WONDERING, 'How do I mill flour?'],
                    _millie => [
                        Emote.GENERIC,
                        'Making flour is pretty easy. First of all you need to get some grain. ' +
                            'You can pick some from wheat fields. There is one just outside the Mill, but there are ' +
                            'many others scattered across Gielinor.',
                    ],
                    _millie => [
                        Emote.GENERIC,
                        'Feel free to pick wheat from our field! There always seems to be plenty ' + 'of wheat there.',
                    ],
                    _player => [Emote.WONDERING, 'Then I bring my wheat here?'],
                    _millie => [
                        Emote.GENERIC,
                        'Yes, or one of the other mills in Gielinor. They all work the same way. ' +
                            'Just take your grain to the top floor of the mill (up two ladders, there are three floors ' +
                            'including this one) and then place some',
                    ],
                    _millie => [
                        Emote.GENERIC,
                        'grain into the hopper. Then you need to start the grinding process by ' +
                            'pulling the hopper lever. You can add more grain, but each time you add grain you have to ' +
                            'pull the hopper lever again.',
                    ],
                    _player => [Emote.WONDERING, 'So where does the flour go then?'],
                    _millie => [
                        Emote.GENERIC,
                        `The flour appears in this room here, you'll need a pot to put the flour ` +
                            'into. One pot will hold the flour made by one load of grain',
                    ],
                    _millie => [
                        Emote.GENERIC,
                        `And that's it! You now have some pots of finely ground flour of the ` +
                            `highest quality. Ideal for making tasty cakes or delicous bread. I'm not a cook so you'll ` +
                            'have to ask a cook to find',
                    ],
                    _millie => [Emote.GENERIC, 'out how to bake things.'],
                    _player => [Emote.HAPPY, 'Great! Thanks for your help.'],
                ],
                `I'm fine, thanks.`,
                [_player => [Emote.GENERIC, `I'm fine, thanks.`]],
            ],
        ],
    );

const gillieDialogue: npcInteractionActionHandler = async details =>
    dialogue(
        [details.player, { npc: details.npc, key: 'gillie' }],
        [
            _gillie => [Emote.HAPPY, `Hello, I'm Gillie the Milkmaid. What can I do for you?`],
            _options => [
                'Who are you?',
                [
                    _player => [Emote.WONDERING, 'Who are you?'],
                    _gillie => [Emote.GENERIC, 'My name is Gillie Groats. My father is a farmer and I milk the cows for him.'],
                    _player => [Emote.WONDERING, 'Do you have nay buckets of milk spare?'],
                    _gillie => [
                        Emote.GENERIC,
                        `I'm afraid not. We need all of our milk to sell to market, ` +
                            'but you can milk the cow yourself if you need the milk.',
                    ],
                    _player => [Emote.GENERIC, 'Thanks.'],
                ],
                'So how do you milk a cow then?',
                [
                    _player => [Emote.WONDERING, 'So how do you milk a cow then?'],
                    _gillie => [Emote.HAPPY, `It's very easy. First you need an empty bucket to hold the milk.`],
                    _gillie => [Emote.HAPPY, `Then find a dairy cow to milk - you can't milk just any cow.`],
                    _player => [Emote.SKEPTICAL, 'How do I find a dairy cow?'],
                    _gillie => [
                        Emote.GENERIC,
                        'They are easy to spot - they are dark brown and white, unlike ' +
                            'beef cows, which are light brown and white. We also tether them to a post to stop them ' +
                            'wandering around all over the place.',
                    ],
                    _gillie => [Emote.GENERIC, 'There are a couple very near, in this field.'],
                    _gillie => [Emote.GENERIC, 'Then just milk the cow and your bucket will fill with tasty, untritious milk.'],
                ],
                `I'm fine, thanks.`,
                [_player => [Emote.GENERIC, `I'm fine, thanks.`]],
            ],
        ],
    );

export default {
    pluginId: 'rs:lumbridge_farm_helpers',
    hooks: [
        {
            type: 'npc_interaction',
            npcs: 'rs:gillie_groats',
            options: 'talk-to',
            walkTo: true,
            handler: gillieDialogue,
        },
        {
            type: 'npc_interaction',
            npcs: 'rs:millie_miller',
            options: 'talk-to',
            walkTo: true,
            handler: millieDialogue,
        },
    ],
};
