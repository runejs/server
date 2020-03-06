import { npcAction } from '@server/world/actor/player/action/npc-action';
import { ActionType, RunePlugin } from '@server/plugins/plugin';
import { npcIds } from '@server/world/config/npc-ids';
import { quests } from '@server/world/config/quests';
import { dialogueAction, DialogueEmote } from '@server/world/actor/player/action/dialogue-action';

const startQuestAction: npcAction = (details) => {
    const { player, npc } = details;

    dialogueAction(player)
        .then(d => d.npc(npc, DialogueEmote.DISTRESSED_1, [ 'What am I to do?' ]))
        .then(d => d.options('Select an Option', [ `What's wrong?`, `Can you make me a cake?`, `You don't look very happy.`, `Nice hat!` ]))
        .then(d => {
            switch(d.action) {
                case 1:
                    return d.player(DialogueEmote.DEFAULT, [ `What's wrong?` ]);
                case 2:
                    return d.player(DialogueEmote.DEFAULT, [ `You're a cook, why don't you bake me a cake?` ])
                        .then(d => d.npc(npc, DialogueEmote.SAD_1, [ `*sniff* Don't talk to me about cakes...` ]))
                        .then(d => d.player(DialogueEmote.DEFAULT, [ `What's wrong?` ]));
                case 3:
                    return d.player(DialogueEmote.DEFAULT, [ `You don't look very happy.` ])
                        .then(d => d.npc(npc, DialogueEmote.SAD_1, [ `No, I'm not. The world is caving in around me - I am`,
                            `overcome by dark feelings of impending doom.` ]))
                        .then(d => d.options('Select an Option', [ `What's wrong?`, `I'd take the rest of the day off if I were you.` ]))
                        .then(d => {
                            switch(d.action) {
                                case 1:
                                    return d.player(DialogueEmote.DEFAULT, [ `What's wrong?` ]);
                                case 2:
                                    return d.player(DialogueEmote.DEFAULT, [ `I'd take the rest of the day off if I were you.` ])
                                        .then(d => d.npc(npc, DialogueEmote.CALM_TALK_1, [ `No, that's the worst thing I could do. I'd get in terrible`,
                                            `trouble.` ]))
                                        .then(d => d.player(DialogueEmote.CONSIDERING, [ `Well maybe you need to take a holiday...` ]))
                                        .then(d => d.npc(npc, DialogueEmote.CALM_TALK_1, [ `That would be nice, but the Duke doesn't allow holidays`,
                                            `for core staff.` ]))
                                        .then(d => d.player(DialogueEmote.CONSIDERING, [ `Hmm, why not run away to the sea and start a new`,
                                            `life as a Pirate?` ]))
                                        .then(d => d.npc(npc, DialogueEmote.SAD_2, [ `My wife gets sea sick, and I have an irrational fear of`,
                                            `eyepatches. I don't see it working myself.` ]))
                                        .then(d => d.player(DialogueEmote.DEFAULT, [ `I'm afraid I've run out of ideas.` ]))
                                        .then(d => d.npc(npc, DialogueEmote.SAD_1, [ `I know I'm doomed.` ]))
                                        .then(d => d.player(DialogueEmote.DEFAULT, [ `What's wrong?` ]));
                            }
                        });
                case 4:
                    return d.player(DialogueEmote.DEFAULT, [ `Nice hat!` ])
                        .then(d => d.npc(npc, DialogueEmote.DEFAULT, [ `Err thank you. It's a pretty ordinary cooks hat really.` ]))
                        .then(d => d.player(DialogueEmote.CONSIDERING, [ `Still, suits you. The trousers are pretty special too.` ]))
                        .then(d => d.npc(npc, DialogueEmote.DEFAULT, [ `It's all standard cook's issue uniform...` ]))
                        .then(d => d.player(DialogueEmote.CONSIDERING, [ `The whole hat, apron, striped trousers ensemble - it`,
                            `works. It makes you look like a real cook.` ]))
                        .then(d => d.npc(npc, DialogueEmote.ANGRY_1, [ `I am a real cook! I haven't got time to be chatting`,
                            `about Culinary Fashion. I am in desperate need of help!` ]))
                        .then(d => d.player(DialogueEmote.DEFAULT, [ `What's wrong?` ]));
            }
        })
        .then(d => d.npc(npc, DialogueEmote.DISTRESSED_1, [ `Oh dear, oh dear, oh dear, I'm in a terrible terrible`,
            `mess! It's the Duke's birthday today, and I should be`, `making him a lovely big birthday cake.` ]))
        .then(d => d.npc(npc, DialogueEmote.DISTRESSED_2, [ `I've forgotten to buy the ingredients. I'll never get`,
            `them in time now. He'll sack me! What will I do? I have`, `four children and a goat to look after. Would you help`,
            `me? Please?` ]))
        .then(d => d.options('Select an Option', [ `I'm always happy to help a cook in distress.`, `I can't right now, maybe later.` ]))
        .then(d => {
            switch(d.action) {
                case 1:
                    player.setQuestStage(quests.cooksAssistant, 'COLLECTING');
                    return d.player(DialogueEmote.DEFAULT, [ `Yes, I'll help you.` ]) // @TODO set stage to started
                        .then(d => d.npc(npc, DialogueEmote.DEFAULT, [ `Oh thank you, thank you. I need milk, an egg and`,
                            `flour. I'd be very grateful if you can get them for me.` ]))
                        .then(d => d.player(DialogueEmote.DEFAULT, [ `So where do I find these ingredients then?` ]))
                        // @TODO options for "where do I find x"
                        .then(d => {
                            d.close();
                            return d;
                        });
                case 2:
                    return d.player(DialogueEmote.DEFAULT, [ `No, I don't feel like it. Maybe later.` ])
                        .then(d => d.npc(npc, DialogueEmote.DEFAULT, [ `Fine. I always knew you Adventurer types were callous`,
                            `beasts. Go on your merry way!` ]))
                        .then(d => {
                            d.close();
                            return d;
                        });
            }
        });
};

const talkToCookDuringQuestAction: npcAction = (details) => {
    const { player, npc } = details;

    dialogueAction(player)
        .then(d => d.npc(npc, DialogueEmote.DEFAULT, [ `Hey fam, how's the ingredient hunt going?` ]))
        .then(d => d.close());
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
