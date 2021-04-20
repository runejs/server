import { dialogue, Emote, goto, execute } from '../../../game-engine/world/actor/dialogue';
import { animationIds } from '../../../game-engine/world/config/animation-ids';
import { Achievements, giveAchievement } from '../../../game-engine/world/actor/player/achievements';


const handler = async ({ player, npc }) => {
    let sadEnding = false;

    const dialogueSuccessful = await dialogue([ player, { npc, key: 'hans' } ], [
        hans => [ Emote.GENERIC, `Welcome to RuneJS!` ],
        (hans, tag_Hans_Question) => [ Emote.HAPPY, `How do you feel about RuneJS so far?\n` +
        `Please take a moment to let us know what you think!` ],
        options => ([
            `Love it!`, [
                player => [ Emote.HAPPY, `Loving it so far, thanks for asking!` ],
                hans => [ Emote.HAPPY, `You're very welcome! Glad to hear it.` ]
            ],
            `Kind of cool.`, [
                player => [ Emote.GENERIC, `It's kind of cool, I guess. Bit of a weird gimmick.` ],
                hans => [ Emote.HAPPY, `Please let us know if you have any suggestions.` ]
            ],
            `Not my cup of tea, honestly.`, [
                player => [ Emote.SKEPTICAL, `Not really my cup of tea, but keep at it.` ],
                hans => [ Emote.GENERIC, `Thanks for the support!` ]
            ],
            `It's literally the worst.`, [
                player => [ Emote.ANGRY, `Literally the worst thing I've ever seen. You disgust me on a personal level.` ],
                hans => [ Emote.SAD, `I-is that so?... Well I'm... I'm sorry to hear that.` ],
                execute(() => sadEnding = true)
            ],
            `What?`, [
                player => [ Emote.DROWZY, `What?...` ],
                goto('tag_Hans_Question')
            ]
        ])
    ]);

    npc.clearFaceActor();
    player.clearFaceActor();

    if(dialogueSuccessful) {
        if(sadEnding) {
            npc.playAnimation(animationIds.cry);
            npc.say(`Jerk!`);
            player.sendMessage(`Hans wanders off rather dejectedly.`);
        } else {
            player.sendMessage(`Hans wanders off aimlessly through the courtyard.`);
        }

        giveAchievement(Achievements.WELCOME, player);
    }
};


module.exports = {
    pluginId: 'rs:hans',
    hooks: [
        {
            type: 'npc_interaction',
            npcs: 'rs:hans',
            options: 'talk-to',
            walkTo: true,
            handler
        }
    ]
};
