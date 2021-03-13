import { npcInteractionActionHandler } from '@engine/world/action/npc-interaction.action';
import { dialogue, Emote } from '@engine/world/actor/dialogue';
import { findNpc } from '@engine/config';


const talkTo : npcInteractionActionHandler = (details) => {
    const { player, npc } = details;
    dialogue([player, { npc, key: 'wilough' }, { npc: findNpc('rs:varrock_shilop').gameId, key: 'shilop' }], [
        player => [Emote.GENERIC, `Hello again.`],
        wilough => [Emote.GENERIC, `You think you're tough do you?`],
        player => [Emote.GENERIC, `Pardon?`],
        wilough => [Emote.ANGRY, `I can beat anyone up!`],
        shilop => [Emote.BLANK_STARE, `He can you know!`],
        player => [Emote.BLANK_STARE, `Really?`]
    ]);
};

export default {
    npcs: 'rs:varrock_wilough',
    type: 'npc_interaction',
    options: ['talk-to'],
    walkTo: true,
    handler: talkTo
};
