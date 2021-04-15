import { dialogue, Emote } from '@engine/world/actor/dialogue';
import { QuestDialogueHandler } from '@engine/config/quest-config';
import { Player } from '@engine/world/actor/player/player';
import { Npc } from '@engine/world/actor/npc/npc';

export const phillipaDialogueHandler: QuestDialogueHandler = {
    0: async (player: Player, npc: Npc) => {
        const participants = [player, { npc, key: 'phillipa' }];
        await dialogue(participants, [
            player => [Emote.GENERIC, `Hello`],
            phillipa => [Emote.HAPPY, `Hi, I'm Phillipa! Juliet's cousin? I like to keep an eye on her, make sure that dashing young Romeo doesn't just steal away from here under our plain old noses!`],
            phillipa => [Emote.GENERIC, `He'd do it you know... he's ever so dashing, and cavalier, in a wet blanket sort of way.`]
        ]);
    },

    1: 0,

    2: async (player: Player, npc: Npc) => {
        const participants = [player, { npc, key: 'phillipa' }];
        await dialogue(participants, [
            phillipa => [Emote.HAPPY, `Oh, hello. Juliet has told me what you're doing for her and Romeo, and I have to say I'm very grateful to you. Juliet deserves a bit of happiness in her life.`],
            phillipa => [Emote.HAPPY, `And I'm sure Romeo is just the sort of jester to make her laugh out loud - hysterically you might say.`],
            phillipa => [Emote.HAPPY, `He always brings a tear to my eyes - tears of happiness at his foolish antics!`],
            player => [Emote.GENERIC, `Oh, thanks. I like to do my cupid bit.`]
        ]);
    }
}
