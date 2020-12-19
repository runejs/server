import { commandAction } from '@server/world/action/player-command-action';
import { world } from '@server/game-server';
import { dialogue, Emote, execute } from '@server/world/actor/dialogue';

const action: commandAction = (details) => {
    const { player } = details;
    const npc = world.npcList[0];

    dialogue([ player, { npc, key: 'hans' } ], [
        hans => [ Emote.GENERIC, 'Hey how are you?' ],
        () => ({
            'Doing great!': [
                player => [ Emote.HAPPY, 'Doings great, how about yourself?' ],
                hans => [ Emote.HAPPY, `Can't complain.` ]
            ],
            'Eh, not bad.': [
                player => [ Emote.DROWZY, 'Eh, not bad.' ],
                hans => [ Emote.GENERIC, 'I feel ya.' ]
            ],
            'Not so good.': [
                player => [ Emote.SAD, 'Not so good, honestly.' ],
                hans => [ Emote.WORRIED, 'What has you down?' ],
                player => [ Emote.SAD, `Well, first it started this morning when my cat woke me up an hour early. After that, the little bastard just kept meowing and meowing at me...` ],
                execute(() => {
                    player.setQuestProgress('cooks_assistant', 'NOT_STARTED');
                    player.sendMessage('Here ya go!');
                }),
                hans => [ Emote.SAD, `Shit that sucks fam, I'm sorry.`  ]
            ]
        }),
        player => [ Emote.GENERIC, `See ya around.` ]
    ]).then(() => {
        // do something with dialogue result.
    });
};

export default {
    type: 'player_command', commands: 'd', action
};
