import { itemIds } from '@engine/world/config/item-ids';
import { objectInteractionActionHandler } from '@engine/action';
import { soundIds } from '@engine/world/config/sound-ids';
import { itemOnObjectActionHandler } from '@engine/action';
import { Player } from '@engine/world/actor/player/player';
import { ObjectConfig } from '@runejs/filestore';
import { playerInitActionHandler } from '@engine/action';


function flourBin(details: { objectConfig: ObjectConfig, player: Player }): void {
    const { player, objectConfig } = details;

    if (!details.player.savedMetadata['mill-flour']) {
        player.sendMessage(`The ${(objectConfig.name || '').toLowerCase()} is already empty. You need to place wheat in the hopper upstairs `);
        player.sendMessage(`first.`);
    } else {
        if (player.hasItemInInventory(itemIds.pot)) {
            player.playSound(soundIds.potContentModified, 7);
            player.removeFirstItem(itemIds.pot);
            player.giveItem(itemIds.potOfFlour);
            details.player.savedMetadata['mill-flour'] -= 1;
        } else {
            player.sendMessage(`You need a pot to hold the flour in.`);
        }
    }

    updateBin(details);
}


export const updateBin: playerInitActionHandler = (details) => {
    const count = (details.player.savedMetadata['mill-flour'] || 0) === 0 ? 0 : 1;
    details.player.outgoingPackets.updateClientConfig(695, count);
};



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
            objectIds: [ 1781, 5792, 1782 ],
            itemIds: [ itemIds.pot ],
            walkTo: true,
            handler: actionItem
        },
        {
            type: 'player_init',
            handler: updateBin
        },
        {
            type: 'object_interaction',
            objectIds: [ 1781, 1782],
            options: [ 'empty' ],
            walkTo: true,
            handler: actionInteract
        }
    ]
};
