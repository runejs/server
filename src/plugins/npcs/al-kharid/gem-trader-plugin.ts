import { npcAction } from '@server/world/actor/player/action/npc-action';
import { ActionType, RunePlugin } from '@server/plugins/plugin';
import { openShop } from '@server/world/actor/player/action/shop-action';
import { dialogueAction, DialogueEmote } from '@server/world/actor/player/action/dialogue-action';

const tradeAction : npcAction = (details)  => {
    openShop(details.player, 'ALKHARID_GEM_TRADER');
};

const talkToAction : npcAction = (details) => {
    const {player, npc} = details;
    dialogueAction(player)
        .then(d => d.npc(npc, DialogueEmote.CALM_TALK_1, [ 'Good day to you, traveller.', 'Would you be interested in buying some gems?']))
        .then(d => d.options('Would you be interested in buying some gems?', ['Yes, please.', 'No, thank you.']))
        .then(d => {
            switch (d.action) {
                case 1:
                    return d.player(DialogueEmote.JOYFUL, [ 'Yes, please.!' ])
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

export default new RunePlugin([
    {type: ActionType.NPC_ACTION, npcIds: 540, options: 'trade', walkTo: true, action: tradeAction},
    {type: ActionType.NPC_ACTION, npcIds: 540, options: 'talk-to', walkTo: true, action: talkToAction}
]);
