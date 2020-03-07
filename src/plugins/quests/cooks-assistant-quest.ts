import { npcAction } from '@server/world/actor/player/action/npc-action';
import { ActionType, RunePlugin } from '@server/plugins/plugin';
import { npcIds } from '@server/world/config/npc-ids';
import { quests } from '@server/world/config/quests';
import { dialogue, Emote, execute } from '@server/world/actor/dialogue';

const startQuestAction: npcAction = (details) => {
    const { player, npc } = details;

    dialogue([ player, { npc, key: 'cook' }], [
        cook => [ Emote.WORRIED, `What am I to do?` ],
        () => ({
            'What\'s wrong?': [],
            'Can you make me a cake?': [
                player => [ Emote.HAPPY, `You're a cook, why don't you bake me a cake?` ],
                cook => [ Emote.SAD, `*sniff* Don't talk to me about cakes...` ]
            ],
            'You don\'t look very happy.': [
                player => [ Emote.WORRIED, `You don't look very happy.` ],
                cook => [ Emote.SAD, `No, I'm not. The world is caving in around me - I am overcome by dark feelings of impending doom.` ],
                () => ({
                    'What\'s wrong?': [],
                    'I\'d take the rest of the day off if I were you.': [
                        player => [ Emote.GENERIC, `I'd take the rest of the day off if I were you.` ],
                        cook => [ Emote.WORRIED, `No, that's the worst thing I could do. I'd get in terrible trouble.` ],
                        player => [ Emote.SKEPTICAL, `Well maybe you need to take a holiday...` ],
                        cook => [ Emote.SAD, `That would be nice, but the Duke doesn't allow holidays for core staff.` ],
                        player => [ Emote.LAUGH, `Hmm, why not run away to the sea and start a new life as a Pirate?` ],
                        cook => [ Emote.SKEPTICAL, `My wife gets sea sick, and I have an irrational fear of eyepatches. I don't see it working myself.` ],
                        player => [ Emote.WORRIED, `I'm afraid I've run out of ideas.` ],
                        cook => [ Emote.SAD, `I know I'm doomed.` ]
                    ]
                })
            ],
            'Nice hat!': [
                player => [ Emote.HAPPY, `Nice hat!` ],
                cook => [ Emote.SKEPTICAL, `Err thank you. It's a pretty ordinary cooks hat really.` ],
                player => [ Emote.HAPPY, `Still, suits you. The trousers are pretty special too.` ],
                cook => [ Emote.SKEPTICAL, `It's all standard cook's issue uniform...` ],
                player => [ Emote.POMPOUS, `The whole hat, apron, striped trousers ensemble - it works. It makes you look like a real cook.` ],
                cook => [ Emote.ANGRY, `I am a real cook! I haven't got time to be chatting about Culinary Fashion. I am in desperate need of help!` ]
            ]
        }),
        player => [ Emote.HAPPY, `What's wrong?` ],
        cook => [ Emote.WORRIED, `Oh dear, oh dear, oh dear, I'm in a terrible terrible ` +
            ` mess! It's the Duke's birthday today, and I should be making him a lovely big birthday cake.` ],
        cook => [ Emote.WORRIED, `I've forgotten to buy the ingredients. I'll never get ` +
            `them in time now. He'll sack me! What will I do? I have four children and a goat to ` +
            `look after. Would you help me? Please?` ],
        () => ({
            'I\'m always happy to help a cook in distress.': [
                execute(() => {

                }),
                player => [ Emote.GENERIC, `Yes, I'll help you.` ],
                cook => [ Emote.HAPPY, `Oh thank you, thank you. I need milk, an egg and flour. I'd be very grateful ` +
                    `if you can get them for me.` ],
                player => [ Emote.GENERIC, `So where do I find these ingredients then?` ]
            ],
            'I can\'t right now, maybe later.': [
                player => [ Emote.GENERIC, `No, I don't feel like it. Maybe later.` ],
                cook => [ Emote.ANGRY, `Fine. I always knew you Adventurer types were callous beasts. Go on your merry way!` ]
                // @TODO options for "where do I find x"
            ]
        })
    ]).catch(() => {});
};

const talkToCookDuringQuestAction: npcAction = (details) => {
    const { player, npc } = details;

    dialogue([ player, { npc, key: 'cook' }], [
        npc => [ Emote.HAPPY, `Hey fam, how's the ingredient hunt going?` ]
    ]);
};

export default new RunePlugin([{
    type: ActionType.NPC_ACTION,
    quest: { questId: quests.cooksAssistant.id, stage: 'NOT_STARTED' },
    npcIds: npcIds.lumbridgeCook,
    options: 'talk-to',
    walkTo: true,
    action: startQuestAction
}, {
    type: ActionType.NPC_ACTION,
    quest: { questId: quests.cooksAssistant.id, stage: 'COLLECTING' },
    npcIds: npcIds.lumbridgeCook,
    options: 'talk-to',
    walkTo: true,
    action: talkToCookDuringQuestAction
}]);
