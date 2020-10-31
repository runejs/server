import { npcAction } from '@server/world/actor/player/action/npc-action';
import { openShop } from '@server/world/actor/player/action/shop-action';
import { npcIds } from '@server/world/config/npc-ids';
import { dialogueAction, DialogueEmote } from '@server/world/actor/player/action/dialogue-action';

const tradeAction: npcAction = (details) => {
    openShop(details.player, 'DOMMIK_CRAFTING_STORE');
};

const talkToAction : npcAction = (details) => {
    const { player, npc } = details;
    dialogueAction(player)
        .then(d => d.npc(npc, DialogueEmote.CALM_TALK_1, ['Would you like to buy some crafting equipment?']))
        .then(d => d.options('Would you like to buy some crafting equipment?', ['No thanks. I\'ve got all the Crafting equipment I need.', 'Let\'s see what you\'ve got, then.']))
        .then(async d => {
            switch (d.action) {
                case 1:
                    return d.player(DialogueEmote.JOYFUL, [ 'No thanks; I\'ve got all the Crafting equipment I need.' ])
                        .then(d => d.npc(npcIds.dommik, DialogueEmote.CALM_TALK_2, ['Okay. Fare well on your travels.']))
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
    { type: 'npc_action', npcIds: npcIds.dommik, options: 'trade', walkTo: true, action: tradeAction },
    { type: 'npc_action', npcIds: npcIds.dommik, options: 'talk-to', walkTo: true, action: talkToAction}
];
