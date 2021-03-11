import { itemIds } from '@engine/world/config/item-ids';
import { objectInteractionActionHandler } from '@engine/world/action/object-interaction.action';
import { soundIds } from '@engine/world/config/sound-ids';
import { itemOnObjectActionHandler } from '@engine/world/action/item-on-object.action';
import { LocationObjectDefinition } from '@runejs/cache-parser';
import { Player } from '@engine/world/actor/player/player';


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

const actionInteract: objectInteractionActionHandler = (details) => {
    flourBin(details);
};

const actionItem: itemOnObjectActionHandler = (details) => {
    flourBin(details);
};

export default [
    {
        type: 'item_on_object',
        objectIds: [1782],
        itemIds: [itemIds.pot],
        walkTo: true,
        handler: actionItem
    },
    {
        type: 'object_action',
        objectIds: [1782],
        options: ['empty'],
        walkTo: true,
        handler: actionInteract
    }
];
