import { randomBetween } from '@engine/util/num';
import { dialogue, Emote, execute, goto } from '@engine/world/actor/dialogue';
import { Quest } from '@engine/world/actor/player/quest';
import { ContentPlugin } from '@engine/plugins/content-plugin';
import { npcInteractionActionHandler, NpcInteractionActionHook } from '@engine/world/action/npc-interaction.action';

const journalHandler = {
    0: `I can start this quest by speaking to <col=800000>Romeo</col> in
        <col=800000>Varrock</col> central square by the <col=800000>fountain.</col>`,

    1: `<str>I have agreed to find Juliet for Romeo and tell her how he feels.\nFor some reason he can't just do this by himself.</str>\n
        I should go and speak to <col=800000>Juliet</col>. I can find her <col=800000>west</col> of <col=800000>Varrock.</col>`,

    2: `<str>I have agreed to find Juliet for Romeo and tell her how he feels. For some reason he can't just do this himself.\n
I found Juliet on the Western edge of Varrock, and told her about Romeo. She gave me a message to take back.</str>\n
I should take the <col=#800000>message</col> from <col=#800000>Juliet</col> to <col=#800000>Romeo</col> in <col=#800000>Varrock</col> central square.`
};

const startQuestAction: npcInteractionActionHandler = async details => {
    const { player, npc } = details;
    const participants = [player, { npc, key: 'romeo' }];
  
    // Romeo starts with a random line
    const randomDialog = randomBetween(0, 5);
    switch (randomDialog) {
        case 0:
            await dialogue(participants, [
                romeo => [Emote.WORRIED, `Blub! Blub...where is my Juliet? Have you seen her?`]
            ]);
            break;
    
        case 1:
            await dialogue(participants, [
                romeo => [Emote.WORRIED, `Looking for a blonde girl, goes by the name of Juliet..quite pretty...haven't seen her have you?`]
            ]);
            break;
    
        case 2:
            await dialogue(participants, [
                romeo => [Emote.WORRIED, `Juliet, Juliet, wherefore art thou Juliet? Have you seen my Juliet?`]
            ]);
            break;
    
        case 3:
            await dialogue(participants, [
                romeo => [Emote.WORRIED, `Oh woe is me that I cannot find my Juliet! You haven't seen Juliet have you?`]
            ]);
            break;
    
        case 4:
            await dialogue(participants, [
                romeo => [Emote.WORRIED, `Sadness surrounds me now that Juliet's father forbids us to meet. Have you seen my Juliet?`]
            ]);
            break;
    
        case 5:
            await dialogue(participants, [
                romeo => [Emote.WORRIED, `What is to become of me and my darling Juliet, I cannot find her anywhere, have you seen her?`]
            ]);
            break;
    }
  
    await dialogue(participants, [
        options => [
            `Yes, I have seen her actually!`, [
                player => [Emote.GENERIC, `Yes, I have seen her actually!`],
                player => [Emote.WONDERING, `At least, I think it was her... Blonde? A bit stressed?`],
                romeo => [Emote.SHOCKED, `Golly...yes, yes...you make her sound very interesting!`],
                romeo => [Emote.WONDERING, `And I'll bet she's a bit of a fox!`],
                player => [Emote.WONDERING, `Well, I guess she could be considered attractive...`],
                romeo => [Emote.HAPPY, `I'll bet she is! Wooooooooo!`],
                romeo => [Emote.GENERIC, `Sorry, all that jubilation has made me forget what we were talking about.`],
                player => [Emote.GENERIC, `You were asking me about Juliet? You seemed to know her?`],
                romeo => [Emote.HAPPY, `Oh yes, Juliet!`],
                romeo => [Emote.HAPPY, `The fox...could you tell her that she is the love of my long and that I life to be with her?`],
                player => [Emote.WONDERING, `What? Surely you mean that she is the love of your life and that you long to be with her?`],
                romeo => [Emote.HAPPY, `Oh yeah...what you said...tell her that, it sounds much better! Oh you're so good at this!`]
            ],
            `No sorry, I haven't seen her.`, [
                player => [Emote.GENERIC, `No sorry, I haven't seen her.`],
                romeo => [Emote.SAD, `Oh...well, that's a shame...I was rather hoping you had.`],
                player => [Emote.WONDERING, `Why? Is she a fugitive? Does she owe you some money or something?`],
                romeo => [Emote.WONDERING, `Hmmm, she might do? Perhaps she does? How do you know?`],
                player => [Emote.ANGRY, `I don't know? I was asking 'YOU' how 'YOU' know Juliet!`],
                romeo => [Emote.HAPPY, `Ahh, yes Juliet, she's my one true love. Well, one of my one true loves! If you see her, could you tell her that she is the love of my long and that I life to be with her?`],
                player => [Emote.WONDERING, `What? Surely you mean that she is the love of your life and that you long to be with her?`],
                romeo => [Emote.HAPPY, `Oh yeah...what you said...tell her that, it sounds much better! Oh you're so good at this!`]
            ],
            `Perhaps I could help to find her for you? `, [
                player => [Emote.WONDERING, `Perhaps I can help find her for you? What does she look like?`],
                romeo => [Emote.HAPPY, `Oh would you? That would be great! She has this sort of hair...`],
                player => [Emote.WONDERING, `Hair...check..`],
                romeo => [Emote.HAPPY, `...and she these...great lips...`],
                player => [Emote.WONDERING, `Lips...right.`],
                romeo => [Emote.HAPPY, `Oh and she has these lovely shoulders as well..`],
                player => [Emote.GENERIC, `Shoulders...right, so she has hair, lips and shoulders...that should cut it down a bit.`],
                romeo => [Emote.HAPPY, `Oh yes, Juliet is very different...please tell her that she is the love of my long and that I life to be with her?`],
                player => [Emote.WONDERING, `What? Surely you mean that she is the love of your life and that you long to be with her?`],
                romeo => [Emote.HAPPY, `Oh yeah...what you said...tell her that, it sounds much better! Oh you're so good at this!`]
            ]
        ]
    ]);

    await dialogue(participants, [
        options => [
            `Yes, ok, I'll let her know.`, [
                execute(() => {
                    player.setQuestProgress('rs:romeo_and_juliet', 1);
                }),
                player => [Emote.GENERIC, `Yes, ok, I'll let her know.`],
                romeo => [Emote.HAPPY, `Oh great! And tell her that I want to kiss her a give.`],
                player => [Emote.ANGRY, `You mean you want to give her a kiss!`],
                romeo => [Emote.HAPPY, `Oh you're good...you are good!`],
                romeo => [Emote.HAPPY, `I see I've picked a true professional...!`],
                moreInfo()
            ],
            `Sorry Romeo, I've got better things to do right now but maybe later?`, [
                player => [Emote.GENERIC, `Sorry Romeo, I've got better things to do right now but maybe later?`],
                romeo => [Emote.SAD, `Oh, ok, well, I guess my Juliet and I can spend some time apart. And as the old saying goes, 'Absinthe makes the heart glow longer'.`],
                player => [Emote.WONDERING, `Don't you mean that, 'Absence makes the...`],
                player => [Emote.GENERIC, `Actually forget it...`],
                romeo => [Emote.WONDERING, `Ok!`]
            ]
        ]
    ]);
};

const romeoSecondTalk: npcInteractionActionHandler = async details => {
    const { player, npc } = details;
    const participants = [player, { npc, key: 'romeo' }];
    await dialogue(participants, [
        player => [Emote.GENERIC, `Hello again, remember me?`],
        romeo => [Emote.WONDERING, `Of course, yes....how are.. you....ermmm...`],
        player => [Emote.ANGRY, `You haven't got a clue who I am do you?`],
        romeo => [Emote.GENERIC, `Not a clue my friend, but you seem to have a friendly face...a little blood stained, and perhaps in need of a wash, but friendly none the less.`],
        player => [Emote.ANGRY, `You asked me to look for Juliet for you!`],
        romeo => [Emote.HAPPY, `Ah yes, Juliet...my sweet darling...what news?`],
        player => [Emote.WONDERING, `Nothing so far, but I need to ask a few questions? `],
        moreInfo()
    ]);
};

const moreInfo = () => {
    return (options, tag_MORE_INFO) => [
        `Where can I find Juliet?`, [
            player => [Emote.WONDERING, `Where can I find Juliet?`],
            romeo => [Emote.WONDERING, `Why do you ask?`],
            player => [Emote.ANGRY, `So that I can try and find her for you!`],
            romeo => [Emote.WONDERING, `Ah yes....quite right. Hmmm, let me think now.`],
            romeo => [Emote.WONDERING, `She may still be locked away at her Father's house on the sest vide of Warrock.`],
            romeo => [Emote.HAPPY, `Oh, I remember how she loved it when I would sing up to her balcony! She would reward me with her own personal items...`],
            player => [Emote.WONDERING, `What, she just gave you her stuff?`],
            romeo => [Emote.GENERIC, `Well, not exactly give...more like 'throw with considerable force'...she's always a kidder that Juliet!`],
            goto('tag_MORE_INFO')
        ],
        `Is there anything else you can tell me about Juliet?`, [
            player => [Emote.WONDERING, `Is there anything else you can tell me about Juliet?`],
            romeo => [Emote.HAPPY, `Oh, there is so much to tell...she is my true love, we intend to spend together forever...I can tell you so much about her..`],
            player => [Emote.GENERIC, `Great!`], romeo => [Emote.WONDERING, `Ermmm.....`],
            romeo => [Emote.WONDERING, `So much can I tell you...`],
            player => [Emote.HAPPY, `Yes..`],
            romeo => [Emote.WONDERING, `So much to tell...why, where do I start!`],
            player => [Emote.GENERIC, `Yes..yes! Please go on...don't let me interrupt...`],
            romeo => [Emote.WONDERING, `Ermmm.....`],
            romeo => [Emote.WONDERING, `...`],
            player => [Emote.WONDERING, `You can't remember can you?`],
            romeo => [Emote.SAD, `Not a thing sorry....`],
            goto('tag_MORE_INFO')
        ],
        `Ok, thanks.`, [
            player => [Emote.GENERIC, `Ok, thanks.`]
        ]
    ];
};

const julietFirstTalk: npcInteractionActionHandler = async details => {
    const { player, npc } = details;
    const participants = [player, { npc, key: 'juliet' }];
    await dialogue(participants, [
        player => [Emote.GENERIC, `Juliet, I come from Romeo. He begs me to tell you that he cares still.`],
        juliet => [Emote.HAPPY, `Oh how my heart soars to hear this news! Please take this message to him with great haste.`],
        player => [Emote.GENERIC, `Well, I hope it's good news...he was quite upset when I left him.`],
        juliet => [Emote.POMPOUS, `He's quite often upset...the poor sensitive soul. But I don't think he's going to take this news very well, however, all is not lost.`],
        juliet => [Emote.HAPPY, `Everything is explained in the letter, would you be so kind and deliver it to him please?`],
        player => [Emote.HAPPY, `Certainly, I'll do so straight away.`],
        juliet => [Emote.HAPPY, `Many thanks! Oh, I'm so very grateful. You may be our only hope.`]
    ]);

    const giveLetterSuccess = player.giveItem('rs:juliet_letter');
    if (giveLetterSuccess) {
        player.setQuestProgress('rs:romeo_and_juliet', 2);
        await dialogue(participants, [
            item => ['rs:juliet_letter', `Juliet gives you a message.`]
        ]);
    } else {
        await dialogue(participants, [
            text => `You don't have enough space in your inventory!`
        ]);
    }
};

const phillipaStartDialogue: npcInteractionActionHandler = async details => {
    const { player, npc } = details;
    const participants = [player, { npc, key: 'phillipa' }];
    await dialogue(participants, [
        player => [Emote.GENERIC, `Hello`],
        phillipa => [Emote.HAPPY, `Hi, I'm Phillipa! Juliet's cousin? I like to keep an eye on her, make sure that dashing young Romeo doesn't just steal away from here under our plain old noses!`],
        phillipa => [Emote.GENERIC, `He'd do it you know... he's ever so dashing, and cavalier, in a wet blanket sort of way.`]
    ]);
};

export default <ContentPlugin>{
    pluginId: 'rs:romeo_and_juliet',
    quests: [
        new Quest({
            id: 'rs:romeo_and_juliet',
            questTabId: 37,
            name: `Romeo & Juliet`,
            points: 5,
            journalHandler,
            onComplete: {
                questCompleteWidget: {
                    rewardText: ['5 Quest Points'],
                    itemId: 1891,
                    modelZoom: 240,
                    modelRotationY: 180,
                    modelRotationX: 180
                }
            }
        })
    ],
    hooks: <NpcInteractionActionHook[]>[{
        // TODO you can actually start the quest by talking to Juliet first
        type: 'npc_interaction',
        questRequirement: {
            questId: 'rs:romeo_and_juliet',
            stage: 0
        },
        npcs: 'rs:romeo',
        options: 'talk-to',
        walkTo: true,
        handler: startQuestAction
    }, {
        type: 'npc_interaction',
        questRequirement: {
            questId: 'rs:romeo_and_juliet',
            stage: 1
        },
        npcs: 'rs:romeo',
        options: 'talk-to',
        walkTo: true,
        handler: romeoSecondTalk
    }, {
        type: 'npc_interaction',
        questRequirement: {
            questId: 'rs:romeo_and_juliet',
            stage: 1
        },
        npcs: 'rs:juliet',
        options: 'talk-to',
        walkTo: true,
        handler: julietFirstTalk
    }, {
        type: 'npc_interaction',
        questRequirement: {
            questId: 'rs:romeo_and_juliet',
            stages: [0, 1, 2]
        },
        npcs: 'rs:phillipa',
        options: 'talk-to',
        walkTo: true,
        handler: phillipaStartDialogue
    }]
};
