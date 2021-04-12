import { Quest } from '@engine/world/actor/player/quest';
import { ContentPlugin } from '@engine/plugins/content-plugin';
import { NpcInteractionActionHook } from '@engine/world/action/npc-interaction.action';
import { findItem } from '@engine/config';

// Dialogues
import { phillipaDialogue } from './phillipa-dialogue';
import { julietDialogue } from './juliet-dialogue';
import { romeoDialogue } from './romeo-dialogue';
import { draulLeptocDialogue } from './draul-leptoc-dialogue';

const journalHandler = {
    0: `I can start this quest by speaking to <col=800000>Romeo</col> in
        <col=800000>Varrock</col> central square by the <col=800000>fountain.</col>`,

    1: `<col=000000><str>I have agreed to find Juliet for Romeo and tell her how he feels.\nFor some reason he can't just do this by himself.</str></col>\n
        I should go and speak to <col=800000>Juliet</col>. I can find her <col=800000>west</col> of <col=800000>Varrock.</col>`,

    2: `<col=000000><str>I have agreed to find Juliet for Romeo and tell her how he feels. For some reason he can't just do this himself.
        I found Juliet on the Western edge of Varrock, and told her about Romeo. She gave me a message to take back.</str></col>
        I should take the <col=800000>message</col> from <col=800000>Juliet</col> to <col=800000>Romeo</col> in <col=800000>Varrock</col> central square.`
};

export const questItems = {
    julietLetter: findItem('rs:juliet_letter')
}

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
        handler: romeoDialogue[0]
    }, {
        type: 'npc_interaction',
        questRequirement: {
            questId: 'rs:romeo_and_juliet',
            stage: 0
        },
        npcs: 'rs:draul_leptoc',
        options: 'talk-to',
        walkTo: true,
        handler: draulLeptocDialogue[0]
    }, {
        type: 'npc_interaction',
        questRequirement: {
            questId: 'rs:romeo_and_juliet',
            stage: 1
        },
        npcs: 'rs:draul_leptoc',
        options: 'talk-to',
        walkTo: true,
        handler: draulLeptocDialogue[1]
    }, {
        type: 'npc_interaction',
        questRequirement: {
            questId: 'rs:romeo_and_juliet',
            stage: 2
        },
        npcs: 'rs:draul_leptoc',
        options: 'talk-to',
        walkTo: true,
        handler: draulLeptocDialogue[2]
    }, {
        type: 'npc_interaction',
        questRequirement: {
            questId: 'rs:romeo_and_juliet',
            stage: 1
        },
        npcs: 'rs:romeo',
        options: 'talk-to',
        walkTo: true,
        handler: romeoDialogue[1]
    }, {
        type: 'npc_interaction',
        questRequirement: {
            questId: 'rs:romeo_and_juliet',
            stage: 1
        },
        npcs: 'rs:juliet',
        options: 'talk-to',
        walkTo: true,
        handler: julietDialogue[0]
    }, {
        type: 'npc_interaction',
        questRequirement: {
            questId: 'rs:romeo_and_juliet',
            stages: [0, 1]
        },
        npcs: 'rs:phillipa',
        options: 'talk-to',
        walkTo: true,
        handler: phillipaDialogue[0]
    }, {
        type: 'npc_interaction',
        questRequirement: {
            questId: 'rs:romeo_and_juliet',
            stage: 2
        },
        npcs: 'rs:phillipa',
        options: 'talk-to',
        walkTo: true,
        handler: phillipaDialogue[1]
    }, {
        type: 'npc_interaction',
        questRequirement: {
            questId: 'rs:romeo_and_juliet',
            stage: 2
        },
        npcs: 'rs:juliet',
        options: 'talk-to',
        walkTo: true,
        handler: julietDialogue[1]
    }]
};
