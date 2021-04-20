import { widgets } from '@engine/config';
import { itemOnPlayerActionHandler } from '@engine/world/action/item-on-player.action';
import { itemInteractionActionHandler } from '@engine/world/action/item-interaction.action';
import { Item } from '@engine/world/items/item';
import { ItemContainer } from '@engine/world/items/item-container';

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
    const otherPlayer = playerWidget.metadata['player'];

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


    const otherPlayerInventory: ItemContainer = otherPlayer.inventory;
    const playerInventory: ItemContainer = details.player.inventory;
    const slotsWithItem: number[] = otherPlayerInventory.findAll(details.itemId);
    let itemAmount: number = 0;
    slotsWithItem.forEach((slot) => itemAmount += otherPlayerInventory.items[slot].amount);
    if (countToRemove == -1 || countToRemove > itemAmount) {
        countToRemove = itemAmount;
    }

    if (!playerInventory.canFit({ itemId: itemIdToAdd, amount: countToRemove })) {
        details.player.sendMessage('Your inventory is full.');
        return;
    }

    const itemToAdd: Item = { itemId: itemIdToAdd, amount: 0 };
    while (countToRemove > 0 && otherPlayerInventory.has(details.itemId)) {
        const invIndex = otherPlayerInventory.findIndex(details.itemId);
        const invItem = otherPlayerInventory.items[invIndex];
        if (countToRemove >= invItem.amount) {
            itemToAdd.amount += invItem.amount;
            countToRemove -= invItem.amount;
            otherPlayerInventory.remove(invIndex);
        } else {
            itemToAdd.amount += countToRemove;
            invItem.amount -= countToRemove;
            countToRemove = 0;
        }
    }

    playerInventory.addStacking(itemToAdd);

    details.player.outgoingPackets.sendUpdateAllWidgetItems(widgets.bank.depositBoxWidget, otherPlayer.inventory);
    details.player.outgoingPackets.sendUpdateAllWidgetItems(widgets.inventory, details.player.inventory);
    otherPlayer.outgoingPackets.sendUpdateAllWidgetItems(widgets.inventory, otherPlayer.inventory);

};

