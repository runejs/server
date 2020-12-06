import { npcAction } from '@server/world/action/npc-action';
import { dialogue, Emote, execute } from '@server/world/actor/dialogue';
import { itemIds } from '@server/world/config/item-ids';
import { widgets } from '@server/config';


const talkToBartender : npcAction = (details) => {
    const { player, npc } = details;

    dialogue([player, { npc, key: 'bartender' }], [
        bartender => [Emote.HAPPY, 'What can I do yer for?'],
        options => [
            `A glass of your finest ale please.`, [
                player => [Emote.HAPPY, `A glass of your finest ale please.`],
                bartender => [Emote.HAPPY, `No problemo. That'll be 2 coins.`],
                execute(() => {
                    const index = player.inventory.findIndex(itemIds.coins);
                    const hasCoins = player.inventory.has(itemIds.coins);

                    if (!hasCoins) {
                        dialogue([player, { npc, key: 'bartender' }], [
                            player => [Emote.VERY_SAD, `Oh dear. I don't seem to have enough money.`],
                        ]);
                    }

                    if (hasCoins && (player.inventory.amountInStack(index) >= 2)) {

                        const amount = player.inventory.amountInStack(index);
                        // Check inventory.
                        if (!player.inventory.hasSpace()) {
                            player.sendMessage(`You don't have enough space in your inventory.`);
                            return;
                        }

                        // Take the coins
                        player.inventory.remove(index);
                        if ((amount - 2) !== 0) {
                            player.inventory.add({
                                itemId: itemIds.coins,
                                amount: (amount - 2)
                            });
                        }

                        // Give the beer.
                        player.inventory.add(itemIds.beer);
                        player.outgoingPackets.sendUpdateAllWidgetItems(widgets.inventory, player.inventory);
                    }
                }),
            ],
            `Can you recommend where an adventurer might make his fortune?`, [
                player => [Emote.WONDERING, `Can you recommend where an adventurer might make his fortune?`],
                bartender => [Emote.LAUGH, `Ooh I don't know if I should be giving away information, makes the game too easy.`],
                options => [
                    `Oh ah well...`, [
                        player => [Emote.WORRIED, `Oh ah well...`]
                    ],
                    `Game? What are you talking about?`, [
                        player => [Emote.WORRIED, `Game? What are you talking about?`],
                        bartender => [Emote.GENERIC, `This world around us... is an online game... called Old School RuneScape.`],
                        player => [Emote.GENERIC, `Nope, still don't understand what you are talking about. What does 'online' mean?`],
                        bartender => [Emote.GENERIC, `It's a sort of connection between magic boxes across the world, big boxes on people's desktops and little ones people can carry. They can talk to each other to play games.`],
                        player => [Emote.GENERIC, `I give up. You're obviously completely mad!`]
                    ],
                    `Just a small clue?`, [
                        player => [Emote.WONDERING, `Just a small clue?`],
                        bartender => [Emote.VERY_SAD, `Go and talk to the bartender at the Jolly Boar Inn, he doesn't seem to mind giving away clues.`]
                    ]
                ]
            ],
            `Do you know where I can get some good equipment?`, [
                player => [Emote.WONDERING, `Do you know where I can get some good equipment?`],
                bartender => [Emote.HAPPY, `Well, there's the sword shop across the road, or there's also all sorts of shops up around the market.`]
            ]
        ]
    ]);
};

const talkToCook : npcAction = (details) => {
    const { npc, player } = details;

    dialogue([player, { npc, key: 'cook' }], [
        cook => [Emote.ANGRY, `What do you want? I'm busy!`],
        options => [
            `Can you sell me any food?`, [
                player => [Emote.WONDERING, `Can you sell me any food?`],
                cook => [Emote.GENERIC, `I suppose I could sell you some cabbage, if you're willing to pay for it. Cabbage is good for you.`],
                execute(() => {

                    const hasCoins = player.inventory.has(itemIds.coins);
                    const index = player.inventory.findIndex(itemIds.coins);

                    // The player doesn't have any coins.
                    if (!hasCoins) {
                        dialogue([player, { npc, key: 'cook' }], [
                            player => [Emote.VERY_SAD, `Oh, I haven't got any money.`],
                            cook => [Emote.ANGRY, `Why are you asking me to sell you food if you haven't got any money? Go away!`]
                        ]);
                    }

                    // The player has enough coins
                    if (hasCoins && (player.inventory.amountInStack(index) >= 2)) {
                        const amount = player.inventory.amountInStack(index);
                        dialogue([player, { npc, key: 'cook' }], [
                            options => [
                                `Alright I'll buy a cabbage.`, [
                                    player => [Emote.HAPPY, `Alright I'll buy a cabbage.`],
                                    execute(() => {

                                        // Check inventory.
                                        if (!player.inventory.hasSpace()) {
                                            player.sendMessage(`You don't have enough space in your inventory.`);
                                            return;
                                        }

                                        // Take the coins
                                        player.inventory.remove(index);
                                        if ((amount - 2) !== 0) {
                                            player.inventory.add({
                                                itemId: itemIds.coins,
                                                amount: (amount - 2)
                                            });
                                        }

                                        // Give the cabbage.
                                        player.inventory.add(itemIds.cabbage);
                                        player.outgoingPackets.sendUpdateAllWidgetItems(widgets.inventory, player.inventory);
                                    }),
                                    cook => [Emote.HAPPY, `It's a deal. Now, make sure you eat it all up. Cabbage is good for you.`],
                                ],
                                `No thanks, I don't like cabbage.`, [
                                    player => [Emote.GENERIC, `No thanks, I don't like cabbage.`],
                                    cook => [Emote.SAD, `Bah! People these days only appreciate junk food.`]
                                ],
                            ]
                        ]);
                    }
                }),
            ],
            `Can you give any free food?`, [
                // PLAYER: Can you give any free food?
                player => [Emote.GENERIC, `Can you give any free food?`],
                cook => [Emote.GENERIC, `Can you give my any free money?`],
                player => [Emote.GENERIC, `Why should I give you free money?`],
                cook => [Emote.GENERIC, `Why should I give you free food?`],
                player => [Emote.GENERIC, `Oh, forget it.`],
            ],
            `I don't want anything from this horrible kitchen.`, [
                player => [Emote.SHOCKED, `I don't want anything from this horrible kitchen.`],
                cook => [Emote.ANGRY, `How dare you? I put a lot of effort into cleaning this kitchen.`],
                cook => [Emote.ANGRY, `My daily sweat and elbow-grease keep this kitchen clean!`],
                player => [Emote.GENERIC, `Ewww!`],
                cook => [Emote.SAD, `Oh, just leave me alone.`]
            ]
        ]
    ]);
};

export default [{
    type: 'npc_action',
    npcs: 'rs:blue_moon_innk_bartender',
    action: talkToBartender,
}, {
    type: 'npc_action',
    npcs: 'rs:blue_moon_inn_cook',
    action: talkToCook
}];
