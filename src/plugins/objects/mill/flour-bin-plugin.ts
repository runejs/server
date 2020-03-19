import { ActionType, RunePlugin } from '@server/plugins/plugin';
import { itemIds } from '@server/world/config/item-ids';
import { objectAction } from '@server/world/actor/player/action/object-action';
import { soundIds } from '@server/world/config/sound-ids';
import { itemOnObjectAction } from '@server/world/actor/player/action/item-on-object-action';
import { LocationObjectDefinition } from '@runejs/cache-parser';
import { Player } from '@server/world/actor/player/player';


function flourBin(details: { objectDefinition: LocationObjectDefinition, player: Player }): void {
    const { player, objectDefinition } = details;

    if (!details.player.metadata['flour']) {
        player.sendMessage(`The ${objectDefinition.name.toLowerCase()} is already empty. You need to place wheat in the hopper upstairs `);
        player.sendMessage(`first.`);
        return;
    }
    if (player.hasItemInInventory(itemIds.pot)) {
        player.playSound(soundIds.potContentModified, 7);
        player.removeFirstItem(itemIds.pot);
        player.giveItem(itemIds.potOfFlour);
        details.player.metadata['flour'] -= 1;
    } else {
        player.sendMessage(`You need a pot to hold the flour in.`);
    }
}

const actionInteract: objectAction = (details) => {
    flourBin(details);
};

const actionItem: itemOnObjectAction = (details) => {
    flourBin(details);
};

export default new RunePlugin([
    {
        type: ActionType.ITEM_ON_OBJECT_ACTION,
        objectIds: [1782],
        itemIds: [itemIds.pot],
        walkTo: true,
        action: actionItem
    },
    {
        type: ActionType.OBJECT_ACTION,
        objectIds: [1782],
        options: ['empty'],
        walkTo: true,
        action: actionInteract
    }
]);
