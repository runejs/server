import { npcInteractionActionHandler } from '@engine/world/action/npc-interaction.action';
import { dialogueAction, DialogueEmote } from '@engine/world/actor/player/dialogue-action';
import { findShop } from '@engine/config/config-handler';


const tradeAction: npcInteractionActionHandler = ({ player }) =>
    findShop('rs:dommiks_crafting_store')?.open(player);

const talkToAction : npcInteractionActionHandler = (details) => {
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

export default {
    pluginId: 'rs:dommik_crafting_shop',
    hooks: [
        { type: 'npc_interaction', npcs: 'rs:alkharid_dommik', options: 'trade', walkTo: true, handler: tradeAction },
        { type: 'npc_interaction', npcs: 'rs:alkharid_dommik', options: 'talk-to', walkTo: true, handler: talkToAction }
    ]
};
