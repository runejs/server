import { npcAction } from '@server/world/action/npc-action';
import { dialogue, Emote, execute, goto } from '@server/world/actor/dialogue';
import { itemIds } from '@server/world/config/item-ids';
import { widgets } from '@server/config';


const talkTo : npcAction = (details) => {
    const { player, npc } = details;
    dialogue([player, { npc, key: 'tutor' }], [
        player => [Emote.GENERIC, `Hello.`],
        tutor => [Emote.GENERIC, `Well met! Are you interested in hearing about the art of smithing?`],
        options => [
            `How can I train my smithing?`, [
                (player, tag_how_to_train) => [Emote.WONDERING, `How can I train my smithing?`],
                tutor => [Emote.GENERIC, `To be able to smith anything, you're going to need one of these beauties.`],
                execute(() => {
                    player.inventory.add(itemIds.hammer);
                    player.sendMessage('The Master Smithing Tutor gives you a hammer.', true);
                    player.outgoingPackets.sendUpdateAllWidgetItems(widgets.inventory, player.inventory);
                }),
                tutor => [Emote.GENERIC, `As you get better you'll find you will be able to smith Mithril and eventually Adamantite and even Runite. This can be very lucrative but very expensive on the coal front.`],
                tutor => [Emote.GENERIC, `It may be worth you stockpiling coal for a while before attempting these difficult metals or even sticking to good old reliable iron by the bucket load.`],
                tutor => [Emote.GENERIC, `If you want to stop yourself from failing to smith iron, I suggest purchasing some rings of forging. Be aware that they will break after a certain number of bars are smelted.`],
                tutor => [Emote.GENERIC, `You can save coal when smelting by using the Blast Furnace over in Keldagrim. But I doubt you will be granted access there, sorry.`],
                tutor => [Emote.GENERIC, `If you are looking for something more interesting to smith, you could talk to Otto Godblessed about smithing hastae. Though I don't think he will talk to you.`],
                tutor => [Emote.WONDERING, `Is there anything else you would like to know?`],
                (options, tag_options) => [
                    `What kinds of things can I smith?`, [
                        goto('tag_what_kinds')
                    ],
                    `Not right now, thank you.`, [
                        goto('tag_no_thanks')
                    ],
                ]
            ],
            `What kinds of things can I smith?`, [
                (player, tag_what_kinds) => [Emote.WONDERING, `What kinds of things can I smith?`],
                tutor => [Emote.GENERIC, `There are many things you can make, from weapons to your good old fashioned armour.`],
                tutor => [Emote.GENERIC, `Weapons are the cheapest things to smith. They range from a measly one bar, all the way to three bars.`],
                tutor => [Emote.GENERIC, `Armour can be the costliest item to smith, the cost of each item ranges from a measly one bar all the way up to a whopping five bars.`],
                tutor => [Emote.GENERIC, `Some weapons and armour, such as darts, will require you to have gained knowledge on how to smith them. This is due to the complex nature of the weapon.`],
                tutor => [Emote.GENERIC, `You might find that other items don't require conventional bars you would gather. Some may require you to piece blades back together or even infuse a crystal into a piece of armour.`],
                tutor => [Emote.GENERIC, `Is there anything else you want to know?`],
                goto('tag_options')
            ],
            `Not right now, thank you.`, [
                (player, tag_no_thanks) => [Emote.GENERIC, `Not right now, thank you.`],
                tutor => [Emote.GENERIC, `Well, just come back any time you want to know anything!`]
            ]
        ]
    ]);
};

export default {
    type: 'npc_action',
    npcs: 'rs:master_smithing_tutor',
    options: ['talk-to'],
    walkTo: true,
    action: talkTo
};
