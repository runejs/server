import { npcInteractionActionHandler } from '@engine/world/action/npc-interaction.action';
import { findShop } from '@engine/config';
import { dialogue, Emote, execute } from '@engine/world/actor/dialogue';


const shopAction: npcInteractionActionHandler = (details)  =>
    findShop('rs:bettys_magic_emporium')?.open(details.player);

const dialogueAction: npcInteractionActionHandler = (details) => {
    const { player, npc } = details;
    let openShop = false;
    dialogue([details.player, { npc: details.npc, key: 'betty' }], [
        betty => [Emote.HAPPY, `Welcome to the magic emporium.`],
        options => [
            `Can I see your wares?`, [
                player => [Emote.HAPPY, `Can I see your wares?`],
                execute(() => {
                    openShop = true;
                })
            ],
            `Sorry I'm not into magic.`, [
                player => [Emote.GENERIC, `Sorry I'm not into magic.`],
                betty => [Emote.HAPPY, `Well, if you see anyone who is into magic, please send them my way.`]
            ]
        ]
    ]);

    if(openShop) {
        shopAction(details);
    }
}

export default {
    pluginId: 'rs:betty_shop',
    hooks: [
        {
            type: 'npc_interaction',
            npcs: 'rs:betty',
            options: 'trade',
            walkTo: true,
            handler: shopAction
        },
        {
            type: 'npc_interaction',
            npcs: 'rs:betty',
            options: 'talk-to',
            walkTo: true,
            handler: dialogueAction,

        },
    ]
};
