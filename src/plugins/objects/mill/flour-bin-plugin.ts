import { ActionType, RunePlugin } from '@server/plugins/plugin';
import { itemIds } from '@server/world/config/item-ids';
import { objectAction } from '@server/world/actor/player/action/object-action';
import { soundIds } from '@server/world/config/sound-ids';
import { itemOnObjectAction } from '@server/world/actor/player/action/item-on-object-action';


export const action: any = (details) => {
    const {player, objectDefinition} = details;

    if (!details.player.metadata['flour']) {
        player.outgoingPackets.chatboxMessage(`The ${objectDefinition.name.toLowerCase()} is already empty. You need to place wheat in the hopper upstairs `);
        player.outgoingPackets.chatboxMessage(`first.`);
        return;
    }
    if (player.hasItemInInventory(itemIds.pot)) {
        player.outgoingPackets.playSound(soundIds.potContentModified, 7);
        player.removeFirstItem(itemIds.pot);
        player.giveItem(itemIds.potOfFlour);
        details.player.metadata['flour'] -= 1;
    } else {
        player.outgoingPackets.chatboxMessage(`You need a pot to hold the flour in.`);
    }
};

const actionInteract: objectAction = (details) => {
    action(details);
};

const actionItem: itemOnObjectAction = (details) => {
    action(details);
};

export default new RunePlugin([
    {
        type: ActionType.ITEM_ON_OBJECT_ACTION,
        objectIds: [1782],
        itemIds: [itemIds.pot],
        walkTo: true,
        actionItem
    },
    {
        type: ActionType.OBJECT_ACTION,
        objectIds: [1782],
        options: ['empty'],
        walkTo: true,
        actionInteract
    }
]);
