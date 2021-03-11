import { commandActionHandler } from '@engine/world/action/player-command.action';
import { itemSelectionDialogue } from '@engine/world/actor/dialogue';
import { logger } from '@runejs/core';

const action: commandActionHandler = async (details) => {
    const { player } = details;

    try {
        const choice = await itemSelectionDialogue(player, 'MAKING', [
            { itemId: 52, itemName: 'Arrow Shafts' },
            { itemId: 50, itemName: 'Shortbow' },
            { itemId: 48, itemName: 'Longbow' },
            { itemId: 9440, itemName: 'Crossbow Stock', offset: -4 } // `offset` and `zoom` are optional params for better item positioning if needed
        ]);

        if(!choice) {
            return;
        }

        player.sendMessage(`Player selected itemId ${ choice.itemId } with amount ${ choice.amount }`);
    } catch(error) {
        logger.error(error);
    }
};

export default {
    type: 'player_command',
    commands: 'itemselection',
    handler: action,
    cancelOtherActions: false
};
