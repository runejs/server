import { itemOnItemActionHandler } from '@engine/action';
import { RottenPotatoItem } from '@plugins/items/rotten-potato/helpers/rotten-potato-helpers';
import { findItem } from '@engine/config/config-handler';

const itemOnPotato: itemOnItemActionHandler = (details) => {
    const slotToDelete = details.usedItem.itemId === RottenPotatoItem.gameId ? details.usedWithSlot : details.usedSlot;
    const item = details.player.inventory.items[slotToDelete].itemId;
    const itemDetails = findItem(item);
    details.player.removeItem(slotToDelete);
    details.player.sendLogMessage(`Whee... ${itemDetails.name} All gone!`, false)
};

export default itemOnPotato;
