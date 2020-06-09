import { ActionType, RunePlugin } from '@server/plugins/plugin';
import { objectIds } from '@server/world/config/object-ids';
import { widgets } from '@server/world/config/widget';
import { objectAction } from '@server/world/actor/player/action/object-action';
import { ItemContainer } from "@server/world/items/item-container";
import { itemAction } from "@server/world/actor/player/action/item-action";
import { Item } from "@server/world/items/item";


export const openBankInterface: objectAction = (details) => {
    details.player.activeWidget = {
        widgetId: widgets.bank.screenWidget.widgetId,
        secondaryWidgetId: widgets.bank.tabWidget.widgetId,
        type: 'SCREEN_AND_TAB',
        closeOnWalk: true
    };

    details.player.outgoingPackets.sendUpdateAllWidgetItems(widgets.bank.tabWidget, details.player.inventory);
    details.player.outgoingPackets.sendUpdateAllWidgetItems(widgets.bank.screenWidget, details.player.bank);


};

export const depositItem: itemAction = (details) => {
    // Check if player might be spawning widget clientside
    if (!details.player.activeWidget ||
        !(details.player.activeWidget.widgetId === widgets.bank.screenWidget.widgetId) ||
        !(details.player.activeWidget.secondaryWidgetId === widgets.bank.tabWidget.widgetId)) {
        return;
    }

    // Check if the player has the item
    if (!details.player.hasItemInInventory(details.itemId)) {
        return;
    }

    let countToRemove: number;
    if (details.option.endsWith("all")) {
        countToRemove = -1;
    } else {
        countToRemove = +details.option.replace("deposit-", "");
    }

    const playerInventory: ItemContainer = details.player.inventory;
    const playerBank: ItemContainer = details.player.bank;
    const slotsWithItem: number[] = playerInventory.findAll(details.itemId);
    let itemAmount: number = 0;
    slotsWithItem.forEach((slot) => itemAmount += playerInventory.items[slot].amount);
    if (countToRemove == -1 || countToRemove > itemAmount) {
        countToRemove = itemAmount
    }

    if (!playerBank.canFit({itemId: details.itemId, amount: countToRemove}, true)) {
        details.player.sendMessage("Your bank is full.");
        return;
    }


    const itemToAdd: Item = {itemId: details.itemId, amount: 0}
    while (countToRemove > 0 && playerInventory.has(details.itemId)) {
        const invIndex = playerInventory.findIndex(details.itemId);
        const invItem = playerInventory.items[invIndex];
        if (countToRemove >= invItem.amount) {
            itemToAdd.amount += invItem.amount;
            countToRemove -= invItem.amount;
            playerInventory.remove(invIndex);
        } else {
            itemToAdd.amount += countToRemove;
            invItem.amount -= countToRemove;
            countToRemove = 0
        }
    }
    playerBank.addStacking(itemToAdd);


    details.player.outgoingPackets.sendUpdateAllWidgetItems(widgets.bank.tabWidget, details.player.inventory);
    details.player.outgoingPackets.sendUpdateAllWidgetItems(widgets.inventory, details.player.inventory);
    details.player.outgoingPackets.sendUpdateAllWidgetItems(widgets.bank.screenWidget, details.player.bank);
};


export const withdrawItem: itemAction = (details) => {
    // Check if player might be spawning widget clientside
    if (!details.player.activeWidget ||
        !(details.player.activeWidget.widgetId === widgets.bank.screenWidget.widgetId) ||
        !(details.player.activeWidget.secondaryWidgetId === widgets.bank.tabWidget.widgetId)) {
        return;
    }
    // Check if the player has the item
    if (!details.player.hasItemInBank(details.itemId)) {
        return;
    }
    let countToRemove: number;
    if (details.option.endsWith("all")) {
        countToRemove = -1;
    } else {
        countToRemove = +details.option.replace("withdraw-", "");
    }

    const playerBank: ItemContainer = details.player.bank;
    const playerInventory: ItemContainer = details.player.inventory;
    const slotWithItem: number = playerBank.findIndex(details.itemId);
    let itemAmount: number = playerBank.items[slotWithItem].amount;
    if (countToRemove == -1 || countToRemove > itemAmount) {
        countToRemove = itemAmount
    }

    if (!details.itemDetails.stackable) {
        const slots = playerInventory.getOpenSlotCount();
        if (slots < countToRemove) {
            countToRemove = slots;
        }
    }

    if (!playerInventory.canFit({itemId: details.itemId, amount: countToRemove})) {
        details.player.sendMessage("Your inventory is full.");
        return;
    }


    const itemToAdd: Item = {itemId: details.itemId, amount: 0}
    while (countToRemove > 0 && playerBank.has(details.itemId)) {
        const invIndex = playerBank.findIndex(details.itemId);
        const invItem = playerBank.items[invIndex];
        if (countToRemove >= invItem.amount) {
            itemToAdd.amount += invItem.amount;
            countToRemove -= invItem.amount;
            playerBank.remove(invIndex);
        } else {
            itemToAdd.amount += countToRemove;
            invItem.amount -= countToRemove;
            countToRemove = 0
        }
    }
    playerInventory.addStacking(itemToAdd);


    details.player.outgoingPackets.sendUpdateAllWidgetItems(widgets.bank.tabWidget, details.player.inventory);
    details.player.outgoingPackets.sendUpdateAllWidgetItems(widgets.inventory, details.player.inventory);
    details.player.outgoingPackets.sendUpdateAllWidgetItems(widgets.bank.screenWidget, details.player.bank);
};


export default new RunePlugin([{
    type: ActionType.OBJECT_ACTION,
    objectIds: objectIds.bankBooth,
    options: ['use-quickly'],
    walkTo: true,
    action: openBankInterface
}, {
    type: ActionType.ITEM_ACTION,
    widgets: widgets.bank.tabWidget,
    options: ['deposit-1', 'deposit-5', 'deposit-10', 'deposit-all'],
    action: depositItem,
}, {
    type: ActionType.ITEM_ACTION,
    widgets: widgets.bank.screenWidget,
    options: ['withdraw-1', 'withdraw-5', 'withdraw-10', 'withdraw-all'],
    action: withdrawItem,
}]);
