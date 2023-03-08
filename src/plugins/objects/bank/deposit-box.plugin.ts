import { objectIds } from '@engine/world/config/object-ids';
import { objectInteractionActionHandler } from '@engine/action';
import { ItemContainer } from '@engine/world/items/item-container';
import { itemInteractionActionHandler } from '@engine/action';
import { fromNote, Item } from '@engine/world/items/item';
import { widgets } from '@engine/config/config-handler';

export const openDepositBoxInterface: objectInteractionActionHandler = ({ player }) => {

    player.interfaceState.openWidget(widgets.bank.depositBoxWidget.widgetId, {
        slot: 'screen',
        multi: true
    });
    player.interfaceState.openWidget(widgets.disabledTab, {
        slot: 'tabarea',
        multi: true
    });


    player.outgoingPackets.sendUpdateAllWidgetItems(widgets.bank.depositBoxWidget, player.inventory);
};



export const depositItem: itemInteractionActionHandler = (details) => {
    // Check if player might be spawning widget clientside
    if (!details.player.interfaceState.findWidget(widgets.bank.depositBoxWidget.widgetId)) {
        return;
    }

    // Check if the player has the item
    if (!details.player.hasItemInInventory(details.itemId)) {
        return;
    }

    // If the item is a noted item, we need to de-note it
    let itemIdToAdd: number = details.itemId;
    const fromNoteId: number = fromNote(details.itemId);
    if (fromNoteId > -1) {
        itemIdToAdd = fromNoteId;
    }

    let countToRemove: number;
    if (details.option.endsWith('all')) {
        countToRemove = -1;
    } else {
        countToRemove = +details.option.replace('deposit-', '');
    }


    const playerInventory = details.player.inventory;
    const playerBank = details.player.bank;
    const slotsWithItem = playerInventory.findAll(details.itemId);

    let itemAmount: number = 0;
    slotsWithItem.forEach((slot) => {
        const item = playerInventory.items[slot];

        if (!item) {
            throw new Error(`Container item was not present, for item id ${details.itemId} in inventory, while trying to deposit`);
        }

        if (item.itemId !== details.itemId) {
            throw new Error(`Container item id mismatch, for item id ${details.itemId} in inventory, while trying to deposit`);
        }

        itemAmount += item.amount;
    });
    if (countToRemove == -1 || countToRemove > itemAmount) {
        countToRemove = itemAmount;
    }

    if (!playerBank.canFit({ itemId: itemIdToAdd, amount: countToRemove }, true)) {
        details.player.sendMessage('Your bank is full.');
        return;
    }


    const itemToAdd: Item = { itemId: itemIdToAdd, amount: 0 };
    while (countToRemove > 0 && playerInventory.has(details.itemId)) {
        const invIndex = playerInventory.findIndex(details.itemId);
        const invItem = playerInventory.items[invIndex];

        if (!invItem) {
            throw new Error(`Inventory item was not present, for item id ${details.itemId} in bank, while trying to deposit`);
        }

        if (countToRemove >= invItem.amount) {
            itemToAdd.amount += invItem.amount;
            countToRemove -= invItem.amount;
            playerInventory.remove(invIndex);
        } else {
            itemToAdd.amount += countToRemove;
            invItem.amount -= countToRemove;
            countToRemove = 0;
        }
    }

    playerBank.addStacking(itemToAdd);


    details.player.outgoingPackets.sendUpdateAllWidgetItems(widgets.inventory, details.player.inventory);
    details.player.outgoingPackets.sendUpdateAllWidgetItems(widgets.bank.depositBoxWidget, details.player.inventory);
};



export default {
    pluginId: 'rs:bank_deposit_box',
    hooks: [
        {
            type: 'object_interaction',
            objectIds: objectIds.depositBox,
            options: [ 'deposit' ],
            walkTo: true,
            handler: openDepositBoxInterface
        }, {
            type: 'item_interaction',
            widgets: widgets.bank.depositBoxWidget,
            options: [ 'deposit-1', 'deposit-5', 'deposit-10', 'deposit-all' ],
            handler: depositItem,
        }
    ]
};
