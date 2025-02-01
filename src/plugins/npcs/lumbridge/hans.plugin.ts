import type { NpcInteractionActionHook } from '@engine/action/pipe/npc-interaction.action';
import { Emote, dialogue, execute, goto } from '@engine/world/actor/dialogue';
import { Achievements, giveAchievement } from '@engine/world/actor/player/achievements';
import { animationIds } from '@engine/world/config/animation-ids';

const handler = async ({ player, npc }) => {
    let sadEnding = false;

    const dialogueParticipants = [player, { npc, key: 'hans' }];

    const dialogueTree = [
        _hans => [Emote.GENERIC, 'Welcome to RuneJS!'],
        (_hans, _tag_Hans_Question) => [
            Emote.HAPPY,
            'How do you feel about RuneJS so far?\n' + 'Please take a moment to let us know what you think!',
        ],
        _options => [
            'Love it!',
            [
                _player => [Emote.HAPPY, 'Loving it so far, thanks for asking!'],
                _hans => [Emote.HAPPY, `You're very welcome! Glad to hear it.`],
            ],
            'Kind of cool.',
            [
                _player => [Emote.GENERIC, `It's kind of cool, I guess. Bit of a weird gimmick.`],
                _hans => [Emote.HAPPY, 'Please let us know if you have any suggestions.'],
            ],
            'Not my cup of tea, honestly.',
            [
                _player => [Emote.SKEPTICAL, 'Not really my cup of tea, but keep at it.'],
                _hans => [Emote.GENERIC, 'Thanks for the support!'],
            ],
            `It's literally the worst.`,
            [
                _player => [Emote.ANGRY, `Literally the worst thing I've ever seen. You disgust me on a personal level.`],
                _hans => [Emote.SAD, `I-is that so?... Well I'm... I'm sorry to hear that.`],
                execute(() => (sadEnding = true)),
            ],
            'What?',
            [_player => [Emote.DROWZY, 'What?...'], goto('tag_Hans_Question')],
        ],
    ];

    const dialogueSuccessful = await dialogue(dialogueParticipants, dialogueTree);

    npc.clearFaceActor();
    player.clearFaceActor();

    if (dialogueSuccessful) {
        if (sadEnding) {
            npc.playAnimation(animationIds.cry);
            npc.say('Jerk!');
            player.sendMessage('Hans wanders off rather dejectedly.');
        } else {
            player.sendMessage('Hans wanders off aimlessly through the courtyard.');
        }

        giveAchievement(Achievements.WELCOME, player);
    }
};

export default {
    pluginId: 'rs:hans',
    hooks: [
        {
            type: 'npc_interaction',
            npcs: 'rs:hans',
            options: 'talk-to',
            walkTo: true,
            handler,
        } as NpcInteractionActionHook,
    ],
};
