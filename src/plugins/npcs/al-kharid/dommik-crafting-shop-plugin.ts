import { npcAction } from '@server/world/action/npc-action';
import { dialogueAction, DialogueEmote } from '@server/world/actor/player/dialogue-action';
import { findShop } from '@server/config';


const tradeAction: npcAction = ({ player }) =>
    findShop('rs:dommiks_crafting_store')?.open(player);

const talkToAction : npcAction = (details) => {
    const { player, npc } = details;
    dialogueAction(player)
        .then(async d => d.npc(npc, DialogueEmote.CALM_TALK_1, ['Would you like to buy some crafting equipment?']))
        .then(async d => d.options('Would you like to buy some crafting equipment?', ['No thanks. I\'ve got all the Crafting equipment I need.', 'Let\'s see what you\'ve got, then.']))
        .then(async d => {
            switch (d.action) {
                case 1:
                    return d.player(DialogueEmote.JOYFUL, [ 'No thanks; I\'ve got all the Crafting equipment I need.' ])
                        .then(async d => d.npc(npc, DialogueEmote.CALM_TALK_2, ['Okay. Fare well on your travels.']))
                        .then(d => {
                            d.close();
                            return d;
                        });
                case 2:
                    return d.player(DialogueEmote.CALM_TALK_1, ['No, thank you.'])
                        .then(d => {
                            tradeAction(details);
                            return d;
                        });

            }
        });
};

export default [
    { type: 'npc_action', npcs: 'rs:alkharid_dommik', options: 'trade', walkTo: true, action: tradeAction },
    { type: 'npc_action', npcs: 'rs:alkharid_dommik', options: 'talk-to', walkTo: true, action: talkToAction }
];
