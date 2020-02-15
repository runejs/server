import { npcAction, NpcActionPlugin } from '@server/world/mob/player/action/npc-action';
import { dialogueAction, DialogueEmote } from '@server/world/mob/player/action/dialogue/dialogue-action';

const action: npcAction = (player, npc) => {
    dialogueAction(player)
        .then(d => d.npc(npc, DialogueEmote.CALM_TALK_1, [ 'Welcome to RuneScape!' ]))
        .then(d => d.npc(npc, DialogueEmote.CALM_TALK_2, [ 'How do you feel about Rune.JS so far?', 'Please take a moment to let us know what you think!' ]))
        .then(d => d.options('Thoughts?', [ 'Love it!', 'Kind of cool.', `Eh, I don't know...`, `Not my cup of tea, honestly.`, `It's literally the worst.` ]))
        .then(d => {
            switch(d.action) {
                case 1:
                    return d.player(DialogueEmote.JOYFUL, [ 'Loving it so far, thanks for asking!' ])
                        .then(d => d.npc(npc, DialogueEmote.JOYFUL,  [ `You're very welcome! Glad to hear it.` ]));
                case 2:
                    return d.player(DialogueEmote.DEFAULT, [ `It's kind of cool, I guess.`, 'Bit of a weird gimmick.' ])
                        .then(d => d.npc(npc, DialogueEmote.DEFAULT,  [ `Please let us know if you have any suggestions.` ]));
                case 3:
                    return d.player(DialogueEmote.NOT_INTERESTED, [ `Ehhh... I don't know...` ])
                        .then(d => d.npc(npc, DialogueEmote.CALM_TALK_1, [ `We're always open to feedback or`, `Pull Requests anytime you like.` ]))
                        .then(d => d.player(DialogueEmote.CALM_TALK_1, [ `I'll keep that in mind, thanks.` ]));
                case 4:
                    return d.player(DialogueEmote.CALM_TALK_2, [ `Not really my cup of tea, but keep at it.` ])
                        .then(d => d.npc(npc, DialogueEmote.JOYFUL, [ `Thanks for the support!` ]));
                case 5:
                    return d.player(DialogueEmote.ANGRY_1, [ `Literally the worst thing I've ever seen.`, 'You disgust me on a personal level.' ])
                        .then(d => d.npc(npc, DialogueEmote.SAD_3, [ `I-is that so?...`, `Well I'm... I'm sorry to hear that.` ]))
                        .then(d => {
                            d.action = 1;
                            return d;
                        });
            }
        })
        .then(d => {
            d.close();

            if(d.action === 1) {
                player.packetSender.chatboxMessage('Hans wanders off rather dejectedly.');
            } else {
                player.packetSender.chatboxMessage('Hans wanders off aimlessly through the courtyard.');
            }
        });
};

export default { npcIds: 0, options: 'talk-to', walkTo: true, action } as NpcActionPlugin;
