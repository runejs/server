import { npcAction } from '@server/world/actor/player/action/npc-action';
import { openShop } from '@server/world/actor/player/action/shop-action';
import { ActionType, RunePlugin } from '@server/plugins/plugin';
import { npcIds } from '@server/world/config/npc-ids';
import { dialogue, Emote, execute } from '@server/world/actor/dialogue';

const tradeAction : npcAction = (details) => {
    openShop(details.player, 'VARROCK_ZAFFS_SUPERIOR_STAFFS');
};

const talkToAction : npcAction = (details) => {
    const { player, npc } = details;

    dialogue([player, { npc, key: 'zaff' }], [
        zaff => [ Emote.GENERIC, `Would you like to buy or sell some staffs?`],
        options => [
            `Yes, please!`, [
                execute(() => {
                    openShop(player, 'VARROCK_ZAFFS_SUPERIOR_STAFFS');
                })
            ],

            'Have you any extra stock of battlestaffs I can buy?', [
                player => [Emote.GENERIC, 'Have you any extra stock of battlestaffs I can buy?'],
                zaff => [Emote.WONDERING, 'No, I\'m afraid I can\'t help you.'],
                execute(() => {
                    player.sendMessage('You must complete the Varrock Achievement Diary before you can access Zaff\'s extra battlestaff stock.');
                })
            ],

            'No, thank you.', [
                player => [Emote.GENERIC, 'No, thank you.'],
                zaff => [Emote.GENERIC, 'Well \'stick\' your head in if you change your mind.'],
                player => [Emote.GENERIC, 'Huh, terrible pun! You just can\'t get the \'staff\' these days!']
            ]

        ]
    ]);
};

export default new RunePlugin([{
    type: ActionType.NPC_ACTION,
    npcIds: npcIds.zaff,
    options: 'trade',
    walkTo: true,
    action: tradeAction
}, {
    type: ActionType.NPC_ACTION,
    npcIds: npcIds.zaff,
    options: 'talk-to',
    walkTo: true,
    action: talkToAction
}]);
