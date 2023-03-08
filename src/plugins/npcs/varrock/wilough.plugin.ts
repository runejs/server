import { npcInteractionActionHandler } from '@engine/action';
import { dialogue, Emote } from '@engine/world/actor/dialogue';
import { findNpc } from '@engine/config/config-handler';


const talkTo : npcInteractionActionHandler = (details) => {
    const { player, npc } = details;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const shilop = findNpc('rs:varrock_shilop')!;
    dialogue([player, { npc, key: 'wilough' }, { npc: shilop.gameId, key: 'shilop' }], [
        player => [Emote.GENERIC, `Hello again.`],
        wilough => [Emote.GENERIC, `You think you're tough do you?`],
        player => [Emote.GENERIC, `Pardon?`],
        wilough => [Emote.ANGRY, `I can beat anyone up!`],
        shilop => [Emote.BLANK_STARE, `He can you know!`],
        player => [Emote.BLANK_STARE, `Really?`]
    ]);
};

export default {
    pluginId: 'rs:varrock_wilough_dialogue',
    hooks: [
        {
            npcs: 'rs:varrock_wilough',
            type: 'npc_interaction',
            options: [ 'talk-to' ],
            walkTo: true,
            handler: talkTo
        }
    ]
};
