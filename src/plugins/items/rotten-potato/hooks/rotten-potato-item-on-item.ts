import { itemOnItemActionHandler } from '@engine/action';
import { RottenPotatoItem } from '@plugins/items/rotten-potato/helpers/rotten-potato-helpers';
import { findItem } from '@engine/config/config-handler';

const itemOnPotato: itemOnItemActionHandler = (details) => {
    const slotToDelete = details.usedItem.itemId === RottenPotatoItem.gameId ? details.usedWithSlot : details.usedSlot;

    const inventoryItem = details.player.inventory.items[slotToDelete];

    if (!inventoryItem) {
        details.player.sendMessage(`You don't have that item in your inventory.`);
        return;
    }

    const item = inventoryItem.itemId;
    const itemDetails = findItem(item);
    details.player.removeItem(slotToDelete);
    details.player.sendLogMessage(`Whee... ${itemDetails?.name || 'Unknown item'} All gone!`, false)
};

export default itemOnPotato;
