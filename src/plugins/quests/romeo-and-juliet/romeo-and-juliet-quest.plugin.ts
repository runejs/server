import { Quest } from '@engine/world/actor/player/quest';
import { ContentPlugin } from '@engine/plugins/content-plugin';
import { NpcInteractionActionHook } from '@engine/world/action/npc-interaction.action';
import { findItem } from '@engine/config';

// Dialogues
import { phillipaDialogueHandler } from './phillipa-dialogue';
import { julietDialogueHandler } from './juliet-dialogue';
import { romeoDialogueHandler } from './romeo-dialogue';
import { draulDialogueHandler } from './draul-leptoc-dialogue';
import { lawrenceDialogueHandler } from './father-lawrence-dialogue';
import { questDialogueActionFactory } from '@engine/config/quest-config';

const journalHandler = {
    0: `I can start this quest by speaking to <col=800000>Romeo</col> in
        <col=800000>Varrock</col> central square by the <col=800000>fountain.</col>`,

    1: `<col=000000><str>I have agreed to find Juliet for Romeo and tell her how he feels. For some reason he can't just do this by himself.</str></col>
        I should go and speak to <col=800000>Juliet</col>. I can find her <col=800000>west</col> of <col=800000>Varrock.</col>`,

    2: `<col=000000><str>I have agreed to find Juliet for Romeo and tell her how he feels. For some reason he can't just do this himself.
        I found Juliet on the Western edge of Varrock, and told her about Romeo. She gave me a message to take back.</str></col>
        I should take the <col=800000>message</col> from <col=800000>Juliet</col> to <col=800000>Romeo</col> in <col=800000>Varrock</col> central square.`
};

export const questItems = {
    julietLetter: findItem('rs:juliet_letter')
}

export const questKey = 'rs:romeo_and_juliet';

export default <ContentPlugin>{
    pluginId: questKey,
    quests: [
        new Quest({
            id: questKey,
            questTabId: 37,
            name: `Romeo & Juliet`,
            points: 5,
            journalHandler,
            onComplete: {
                questCompleteWidget: {
                    rewardText: [],
                    itemId: 756
                }
            }
        })
    ],
    hooks: <NpcInteractionActionHook[]>[{
        type: 'npc_interaction',
        npcs: 'rs:romeo',
        options: 'talk-to',
        walkTo: true,
        handler: questDialogueActionFactory(questKey, romeoDialogueHandler)
    }, {
        type: 'npc_interaction',
        npcs: 'rs:juliet',
        options: 'talk-to',
        walkTo: true,
        handler: questDialogueActionFactory(questKey, julietDialogueHandler)
    }, {
        type: 'npc_interaction',
        npcs: 'rs:draul_leptoc',
        options: 'talk-to',
        walkTo: true,
        handler: questDialogueActionFactory(questKey, draulDialogueHandler)
    }, {
        type: 'npc_interaction',
        npcs: 'rs:phillipa',
        options: 'talk-to',
        walkTo: true,
        handler: questDialogueActionFactory(questKey, phillipaDialogueHandler)
    }, {
        type: 'npc_interaction',
        npcs: 'rs:father_lawrence',
        options: 'talk-to',
        walkTo: true,
        handler: questDialogueActionFactory(questKey, lawrenceDialogueHandler)
    }]
};
