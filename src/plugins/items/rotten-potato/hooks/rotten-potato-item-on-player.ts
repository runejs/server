import { widgets } from '@engine/config/config-handler';
import { itemOnPlayerActionHandler } from '@engine/action';
import { itemInteractionActionHandler } from '@engine/action';
import { Item } from '@engine/world/items/item';
import { Player } from '@engine/world/actor';
import { logger } from '@runejs/common';

export const potatoOnPlayer: itemOnPlayerActionHandler = (details) => {
    const widget = details.player.interfaceState.openWidget(widgets.bank.depositBoxWidget.widgetId, {
        slot: 'screen',
        fakeWidget: 3100001
    });
    widget.metadata['player'] = details.otherPlayer;
    details.player.outgoingPackets.sendUpdateAllWidgetItems(widgets.bank.depositBoxWidget, details.otherPlayer.inventory);


    details.player.modifyWidget(widgets.bank.depositBoxWidget.widgetId, {
        childId: widgets.bank.depositBoxWidget.titleText,
        text: `${details.otherPlayer.username}'s Inventory`
    })



};
export const potatoManipulatePlayerInventory: itemInteractionActionHandler = (details) => {
    const playerWidget = details.player.interfaceState.findWidget(widgets.bank.depositBoxWidget.widgetId);

    if(!playerWidget) {
        return;
    }
    const otherPlayer: Player = playerWidget.metadata['player'];

    if(!otherPlayer) {
        return;
    }


    // If the item is a noted item, we need to de-note it
    const itemIdToAdd: number = details.itemId;

    let countToRemove: number;
    if (details.option.endsWith('all')) {
        countToRemove = -1;
    } else {
        countToRemove = +details.option.replace('deposit-', '');
    }

    const slotsWithItem = otherPlayer.inventory.findAll(details.itemId);
    let itemAmount = 0;
    slotsWithItem.forEach((slot) => {
        const item = otherPlayer.inventory.items[slot];

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

    if (!details.player.inventory.canFit({ itemId: itemIdToAdd, amount: countToRemove })) {
        details.player.sendMessage('Your inventory is full.');
        return;
    }

    const itemToAdd: Item = { itemId: itemIdToAdd, amount: 0 };
    while (countToRemove > 0 && otherPlayer.inventory.has(details.itemId)) {
        const invIndex = otherPlayer.inventory.findIndex(details.itemId);
        const invItem = otherPlayer.inventory.items[invIndex];

        if (!invItem) {
            logger.error(`Could not find item ${details.itemId} in inventory at slot ${invIndex} in rotten potato`);
            return;
        }

        if (countToRemove >= invItem.amount) {
            itemToAdd.amount += invItem.amount;
            countToRemove -= invItem.amount;
            otherPlayer.inventory.remove(invIndex);
        } else {
            itemToAdd.amount += countToRemove;
            invItem.amount -= countToRemove;
            countToRemove = 0;
        }
    }

    details.player.inventory.addStacking(itemToAdd);

    details.player.outgoingPackets.sendUpdateAllWidgetItems(widgets.bank.depositBoxWidget, otherPlayer.inventory);
    details.player.outgoingPackets.sendUpdateAllWidgetItems(widgets.inventory, details.player.inventory);
    otherPlayer.outgoingPackets.sendUpdateAllWidgetItems(widgets.inventory, otherPlayer.inventory);

};
