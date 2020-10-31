import { commandAction } from '@server/world/actor/player/action/input-command-action';
import { itemSelectionAction } from '@server/world/actor/player/action/item-selection-action';

const action: commandAction = (details) => {
    const { player } = details;

    itemSelectionAction(player, 'MAKING', [
        { itemId: 52, itemName: 'Arrow Shafts' },
        { itemId: 50, itemName: 'Shortbow' },
        { itemId: 48, itemName: 'Longbow' },
        { itemId: 9440, itemName: 'Crossbow Stock', offset: -4 } // `offset` and `zoom` are optional params for better item positioning if needed
    ]).then(choice => {
        if(!choice) {
            return;
        }

        player.sendMessage(`Player selected itemId ${choice.itemId} with amount ${choice.amount}`);
    }).catch(error => { console.log('action cancelled'); }); // <- CATCH IS REQUIRED FOR ALL ITEM SELECTION ACTIONS!
    // Always catch these, as the promise returned by `itemSelectionAction` will reject if actions have been cancelled!
    // The console.log is not required, it's only here for testing purposes.
};

export default {
    type: 'player_command',
    commands: 'itemselection',
    action,
    cancelOtherActions: false
};
