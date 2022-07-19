import { npcInitActionHandler } from '@engine/action';
import { World } from '@engine/world';
import { Position } from '@engine/world/position';
import { findNpc } from '@engine/config/config-handler';
import { Npc } from '@engine/world/actor/npc';
import { randomBetween } from '@engine/util/num';
import { activeWorld } from '@engine/world';
const npcs = ['rs:guard:0', 'rs:guard:1']
const npcObjects = npcs.map((sNpc) => findNpc(sNpc));

interface DialogueNpcTree {
    a?: string;
    b?: string;
    a_anim?: number;
    b_anim?: number;
}

const dialogueTrees: DialogueNpcTree[][] = [
    [
        {
            a: 'Hello sir!',
            a_anim: 863,
        },
        {
            b: 'Hello solider.',
            b_anim: 863,
        },
        {
            a: 'What is my purpose?',
        },
        {
            b: 'You get pickpocketed and murdered for scrolls with clues.',
        },
        {
            a_anim: 837,
            a: 'Oh my god.'
        },
        {
            b: 'Yeah welcome to the club pal.',
            b_anim: 2113
        }
    ],
    [
        {
            a: 'Um... So, Sir',
        },
        {
            a_anim: 2836,
            a: 'That enhancment treatment we discussed...?',
        },
        {
            b: `Well... It's kind of weird to be saying this, given the nature of my work,`,
        },
        {
            b: `but I really think you should think twice about this enhancement therapy,`,
        },
        {
            b: `It's all still pretty experimental.`,
        },
        {
            a: `I've made up my mind about it, Sir. I gotta go big. Real big.`,
        },
        {
            b: `You're young, and I have been around the block,`,
        },
        {
            b: `so let me give a bit of advice for free: Size isn't everything.`,
        },
        {
            a: `In my world it is. All the guys are getting it done.`,
        },
        {
            b: `Really? I didn't know that. And they are not having any problems?`,
        },
        {
            b: `I mean... performing their duties so to speak.`,
        },
        {
            b_anim: 14,
            a: `On the contrary, Sir. They are real beasts, all of them.`,
        },
        {
            a: `Always at it, day and night. Really competing to see who's the biggest.`,
        },
        {
            b_anim: 404,
            b: `Wow. I mean... I don't judge, of course.`,
        },
        {
            b: `I mean, this one time in military school. I mean, I was pretty drunk, of course...`,
        },
        {
            a: `You're losing me, Sir. But can you get me those steroids or not?`,
        },
        {
            a: `I don't wanna be the smallest guy in the room.`,
        },
        {
            b_anim: 404,
            b: `Steroids? Oh, steroids! I thought you were talking about something else...`,
        },
        {
            a: `Losing me again, Sir. What did you think I was talking about?`,
        },
        {
            b: `Oh, nothing... I'll get you the damn steroids, don't worry.`,
        },
        {
            a: `I mean, I thought I was pretty clear but... `,
        },
        {
            a: `Well you seem pretty fixated on guys, though. But you know,`,
        },
        {
            a: `that's just fine. This is a medieval world we live in, and as far as I'm concerned,`,
        },
        {
            a: `who you love is entirely up to you.`,
        },
        {
            b_anim: 856,
            b: `Shut up!`,
        },
    ]
]

function startIdleDialogueTree(npc: Npc, closeNpc: Npc, dialogueTree: DialogueNpcTree[]) {
    if(npc.busy || closeNpc.busy){
        return;
    }
    npc.busy = true;
    closeNpc.busy = true;
    npc.face(closeNpc);
    closeNpc.face(npc);
    setTimeout(() => doDialogue(npc,closeNpc,0, dialogueTree), 3 * World.TICK_LENGTH)
}
function doDialogue(a: Npc, b: Npc, dialogueIndex: number, dialogueTree: DialogueNpcTree[]) {
    a.stopAnimation();
    b.stopAnimation();
    if(dialogueIndex > dialogueTree.length-1 || !a.exists || !b.exists) {
        a.busy = false;
        b.busy = false;
        a.clearFaceActor();
        b.clearFaceActor();
        return;
    }
    const currentDialogue = dialogueTree[dialogueIndex];
    if(currentDialogue.a) {
        a.say(currentDialogue.a);
    }
    if(currentDialogue.b) {
        b.say(currentDialogue.b);
    }
    if(currentDialogue.a_anim) {
        a.playAnimation(currentDialogue.a_anim);
    }
    if(currentDialogue.b_anim) {
        b.playAnimation(currentDialogue.b_anim);
    }
    setTimeout(() => doDialogue(a,b,dialogueIndex+1, dialogueTree), 5 * World.TICK_LENGTH)
}

const npcIdleAction =  (npc: Npc) => {
    if(Math.random() >= 0.14) {
        const currentLocation = new Position(npc.position);
        const closeNpcs = activeWorld.findNearbyNpcs(currentLocation, 4);
        for (const closeNpc of closeNpcs) {
            if(closeNpc === npc) {
                continue;
            }
            if(npcObjects.find((oNpc) => oNpc.gameId === closeNpc.id)) {
                if(closeNpc.busy) {
                    continue;
                }
                startIdleDialogueTree(npc, closeNpc, dialogueTrees[randomBetween(0, dialogueTrees.length-1)]);
                return;
            }
        }
    }
}

const guardInitAction: npcInitActionHandler = ({ npc }) => {
    setInterval(() => npcIdleAction(npc), (Math.floor(Math.random() * 20) + 10) * World.TICK_LENGTH);
};


export default {
    pluginId: 'promises:custom_guards',
    hooks: [
        {
            type: 'npc_init',
            npcs: npcs,
            handler: guardInitAction
        }
    ]
};
