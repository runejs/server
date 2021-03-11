import { npcActionHandler } from '@engine/world/action/npc-interaction.action';
import { dialogue, Emote, execute } from '@engine/world/actor/dialogue';
import { findShop } from '@engine/config';


const tradeAction: npcActionHandler = ({ player }) =>
    findShop('rs:zaffs_staffs')?.open(player);

const talkToAction : npcActionHandler = (details) => {
    const { player, npc } = details;

    dialogue([player, { npc, key: 'zaff' }], [
        zaff => [ Emote.GENERIC, `Would you like to buy or sell some staffs?`],
        options => [
            `Yes, please!`, [
                execute(() => {
                    tradeAction(details);
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

export default [{
    type: 'npc_action',
    npcs: 'rs:varrock_zaff',
    options: 'trade',
    walkTo: true,
    action: tradeAction
}, {
    type: 'npc_action',
    npcs: 'rs:varrock_zaff',
    options: 'talk-to',
    walkTo: true,
    action: talkToAction
}];
