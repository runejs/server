import { npcAction } from '@server/world/action/npc-action';
import { dialogueAction, DialogueEmote } from '@server/world/actor/player/dialogue-action';
import { findShop } from '@server/config';


const tradeAction: npcAction = ({ player }) =>
    findShop('rs:alkharid_gem_trader')?.open(player);

const talkToAction : npcAction = (details) => {
    const { player, npc } = details;
    dialogueAction(player)
        .then(async d => d.npc(npc, DialogueEmote.CALM_TALK_1, [ 'Good day to you, traveller.', 'Would you be interested in buying some gems?']))
        .then(async d => d.options('Would you be interested in buying some gems?', ['Yes, please.', 'No, thank you.']))
        .then(async d => {
            switch (d.action) {
                case 1:
                    return d.player(DialogueEmote.JOYFUL, [ 'Yes, please!' ])
                        .then(d => {
                            tradeAction(details);
                            return d;
                        });
                case 2:
                    return d.player(DialogueEmote.CALM_TALK_1, ['No, thank you.'])
                        .then(async d => d.npc(npc, DialogueEmote.ANNOYED, ['Eh, suit yourself.']))
                        .then(d => {
                            d.close();
                            return d;
                        });

            }
        });
};

export default [
    { type: 'np_action', npcs: 'rs:alkharid_gem_trader', options: 'trade', walkTo: true, action: tradeAction },
    { type: 'npc_action', npcs: 'rs:alkharid_gem_trader', options: 'talk-to', walkTo: true, action: talkToAction }
];
