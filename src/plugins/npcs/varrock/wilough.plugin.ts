import type { npcInteractionActionHandler } from '@engine/action/pipe/npc-interaction.action';
import { findNpc } from '@engine/config/config-handler';
import { Emote, dialogue } from '@engine/world/actor/dialogue';

const talkTo: npcInteractionActionHandler = details => {
    const { player, npc } = details;
    const shilop = findNpc('rs:varrock_shilop');

    dialogue(
        [player, { npc, key: 'wilough' }, { npc: shilop.gameId, key: 'shilop' }],
        [
            _player => [Emote.GENERIC, 'Hello again.'],
            _wilough => [Emote.GENERIC, `You think you're tough do you?`],
            _player => [Emote.GENERIC, 'Pardon?'],
            _wilough => [Emote.ANGRY, 'I can beat anyone up!'],
            _shilop => [Emote.BLANK_STARE, 'He can you know!'],
            _player => [Emote.BLANK_STARE, 'Really?'],
        ],
    );
};

export default {
    pluginId: 'rs:varrock_wilough_dialogue',
    hooks: [
        {
            npcs: 'rs:varrock_wilough',
            type: 'npc_interaction',
            options: ['talk-to'],
            walkTo: true,
            handler: talkTo,
        },
    ],
};
