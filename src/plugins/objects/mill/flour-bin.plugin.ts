import { itemIds } from '@engine/world/config/item-ids';
import { objectInteractionActionHandler } from '@engine/world/action/object-interaction.action';
import { soundIds } from '@engine/world/config/sound-ids';
import { itemOnObjectActionHandler } from '@engine/world/action/item-on-object.action';
import { Player } from '@engine/world/actor/player/player';
import { ObjectConfig } from '@runejs/filestore';


function flourBin(details: { objectConfig: ObjectConfig, player: Player }): void {
    const { player, objectConfig } = details;

    if (!details.player.metadata['flour']) {
        player.sendMessage(`The ${objectConfig.name.toLowerCase()} is already empty. You need to place wheat in the hopper upstairs `);
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

export default {
    pluginId: 'rs:flour_bin',
    hooks: [
        {
            type: 'item_on_object',
            objectIds: [ 1782 ],
            itemIds: [ itemIds.pot ],
            walkTo: true,
            handler: actionItem
        },
        {
            type: 'object_interaction',
            objectIds: [ 1782 ],
            options: [ 'empty' ],
            walkTo: true,
            handler: actionInteract
        }
    ]
};
