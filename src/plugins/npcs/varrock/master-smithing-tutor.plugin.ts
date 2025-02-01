import type { npcInteractionActionHandler } from '@engine/action/pipe/npc-interaction.action';
import { widgets } from '@engine/config/config-handler';
import { Emote, dialogue, execute, goto } from '@engine/world/actor/dialogue';
import { itemIds } from '@engine/world/config/item-ids';

const talkTo: npcInteractionActionHandler = details => {
    const { player, npc } = details;
    dialogue(
        [player, { npc, key: 'tutor' }],
        [
            _player => [Emote.GENERIC, 'Hello.'],
            _tutor => [Emote.GENERIC, 'Well met! Are you interested in hearing about the art of smithing?'],
            _options => [
                'How can I train my smithing?',
                [
                    (_player, _tag_how_to_train) => [Emote.WONDERING, 'How can I train my smithing?'],
                    _tutor => [Emote.GENERIC, `To be able to smith anything, you're going to need one of these beauties.`],
                    execute(() => {
                        player.inventory.add(itemIds.hammer);
                        player.sendMessage('The Master Smithing Tutor gives you a hammer.', true);
                        player.outgoingPackets.sendUpdateAllWidgetItems(widgets.inventory, player.inventory);
                    }),
                    _tutor => [Emote.GENERIC, `You're going to get your hand on some metal bars.`],
                    _tutor => [Emote.GENERIC, 'You could do this by mining your own ores and smelting them at a furnace.'],
                    _tutor => [Emote.GENERIC, 'There is a furnace in Lumbridge, just north of the castle opposite the general store.'],
                    _tutor => [Emote.GENERIC, 'If you are looking for some ore, there is a mine east of Varrock.'],
                    _tutor => [Emote.GENERIC, `There you can find some copper and tin ore. Don't forget to bring a pickaxe.`],
                    _tutor => [Emote.GENERIC, 'When you have your bars, bring them to an anvil to open the smithing interface.'],
                    _tutor => [Emote.GENERIC, 'If the item name is in black, this means you do not have the level to smith the item.'],
                    _tutor => [Emote.GENERIC, 'If the name is in white, this means you have the level to smith the item.'],
                    _tutor => [Emote.GENERIC, 'You will see the bars required to smith the item underneath the name of the item.'],
                    _tutor => [
                        Emote.GENERIC,
                        'If the number of bars is in orange, this means that you do not have enough bars to smith the item.',
                    ],
                    _tutor => [Emote.GENERIC, 'If it is in green, this means you have enough bars for the item.'],
                    _player => [Emote.GENERIC, 'Thanks for the advice.'],
                    _options => [
                        'What kinds of things can I smith?',
                        [goto('tag_what_kinds')],
                        'Not right now, thank you.',
                        [goto('tag_no_thanks')],
                    ],
                ],
                'What kinds of things can I smith?',
                [
                    (_player, _tag_what_kinds) => [Emote.WONDERING, 'What kinds of things can I smith?'],
                    _tutor => [Emote.GENERIC, 'There are many things you can make, from weapons to your good old fashioned armour.'],
                    _tutor => [
                        Emote.GENERIC,
                        'Weapons are the cheapest things to smith. They range from a measly one bar, all the way to three bars.',
                    ],
                    _tutor => [
                        Emote.GENERIC,
                        'Armour can be the costliest item to smith, the cost of each item ranges from a measly one bar all the way up to a whopping five bars.',
                    ],
                    _tutor => [
                        Emote.GENERIC,
                        'Some weapons and armours, such as darts, will require you to have gained knowledge on how to smith them.',
                    ],
                    _tutor => [Emote.GENERIC, 'This is due to the complex nature of the weapon.'],
                    _tutor => [Emote.GENERIC, `You might find other items don't require conventional bars you would gather.`],
                    _tutor => [
                        Emote.GENERIC,
                        'Some may require you to piece back together or even infuse a crystal into a piece of armour.',
                    ],
                    _tutor => [Emote.GENERIC, 'Is there anything else you want to know?'],
                    _options => ['How can i train my smithing?', [goto('tag_how_to_train')], 'No, thank you.', [goto('tag_no_thanks')]],
                ],
                'Not right now, thank you.',
                [
                    (_player, _tag_no_thanks) => [Emote.GENERIC, 'Not right now, thank you.'],
                    _tutor => [Emote.GENERIC, 'Well, just come back any time you want to know anything!'],
                ],
            ],
        ],
    );
};

export default {
    pluginId: 'rs:master_smithing_tutor',
    hooks: [
        {
            type: 'npc_interaction',
            npcs: 'rs:master_smithing_tutor',
            options: ['talk-to'],
            walkTo: true,
            handler: talkTo,
        },
    ],
};
