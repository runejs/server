import { npcAction } from '@server/world/action/npc-action';
import { RunePlugin } from '@server/plugins/plugin';
import { openShop } from '@server/world/shops/shops';
import { dialogueAction, DialogueEmote } from '@server/world/actor/player/dialogue-action';
import { npcIds } from '@server/world/config/npc-ids';
import { ActionType } from '@server/world/action/action';

const tradeAction : npcAction = (details)  => {
    openShop(details.player, 'ALKHARID_GEM_TRADER');
};

const talkToAction : npcAction = (details) => {
    const {player, npc} = details;
    dialogueAction(player)
        .then(d => d.npc(npc, DialogueEmote.CALM_TALK_1, [ 'Good day to you, traveller.', 'Would you be interested in buying some gems?']))
        .then(d => d.options('Would you be interested in buying some gems?', ['Yes, please.', 'No, thank you.']))
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
                        .then(d => d.npc(npc, DialogueEmote.ANNOYED, ['Eh, suit yourself.']))
                        .then(d => {
                            d.close();
                            return d;
                        });

            }
        });
};

export default [
    {type: 'np_action', npcIds: npcIds.gemTrader, options: 'trade', walkTo: true, action: tradeAction},
    {type: 'npc_action', npcIds: npcIds.gemTrader, options: 'talk-to', walkTo: true, action: talkToAction}
];
