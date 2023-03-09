import { objectIds } from '@engine/world/config/object-ids';
import { widgetScripts } from '@engine/world/config/widget';
import { objectInteractionActionHandler } from '@engine/action';
import { ItemContainer } from '@engine/world/items/item-container';
import { itemInteractionActionHandler } from '@engine/action';
import { fromNote, Item, toNote } from '@engine/world/items/item';
import { buttonActionHandler } from '@engine/action';
import { dialogue, Emote, execute } from '@engine/world/actor/dialogue';
import { widgets } from '@engine/config/config-handler';
import { Player } from '@engine/world/actor/player/player';
import { logger } from '@runejs/common';


const buttonIds: number[] = [
    92, // as note
    93, // as item
    98, // swap
    99, // insert
];

export const openBankInterface: objectInteractionActionHandler = ({ player }) => {
    player.interfaceState.openWidget(widgets.bank.screenWidget.widgetId, {
        slot: 'screen',
        multi: true
    });
    player.interfaceState.openWidget(widgets.bank.tabWidget.widgetId, {
        slot: 'tabarea',
        multi: true
    });

    player.outgoingPackets.sendUpdateAllWidgetItems(widgets.bank.tabWidget, player.inventory);
    player.outgoingPackets.sendUpdateAllWidgetItems(widgets.bank.screenWidget, player.bank);
    player.outgoingPackets.updateClientConfig(widgetScripts.bankInsertMode, player.settings.bankInsertMode);
    player.outgoingPackets.updateClientConfig(widgetScripts.bankWithdrawNoteMode, player.settings.bankWithdrawNoteMode);
};

export const openPinSettings: objectInteractionActionHandler = ({ player }) => {
    player.interfaceState.openWidget(widgets.bank.pinSettingsWidget.widgetId, {
        slot: 'screen'
    });
};

export const depositItem: itemInteractionActionHandler = (details) => {
    // Check if player might be spawning widget client-side
    if (!details.player.interfaceState.findWidget(widgets.bank.screenWidget.widgetId)) {
        return;
    }

    // Check if the player has the item
    if (!details.player.hasItemInInventory(details.itemId)) {
        return;
    }

    let itemIdToAdd: number = details.itemId;
    const fromNoteId: number = fromNote(details.itemId);
    if (fromNoteId > -1) {
        itemIdToAdd = fromNoteId;
    }

    let countToRemove: number;
    switch (details.option) {
        case 'deposit-1':
            // Deposit 1
            countToRemove = 1;
            break;
        case 'deposit-5':
            // Deposit 5
            countToRemove = 5;
            break;
        case 'deposit-10':
            // Deposit 10
            countToRemove = 10;
            break;
        case 'deposit-all':
            // Deposit all
            countToRemove = -1;
            break;
        default:
            // Should never happen
            throw new Error('Unhandled option in banking plugin: ' + details.option);
    }

    const playerInventory = details.player.inventory;
    const playerBank = details.player.bank;
    const slotsWithItem = playerInventory.findAll(details.itemId);

    let itemAmount = 0;
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
    if (countToRemove === -1 || countToRemove > itemAmount) {
        countToRemove = itemAmount;
    }

    if (!playerBank.canFit({ itemId: itemIdToAdd, amount: countToRemove }, true)) {
        details.player.sendMessage('Your bank is full.');
        return;
    }

    const itemToAdd: Item = {
        itemId: itemIdToAdd,
        amount: removeFromContainer(playerInventory, details.itemId, countToRemove)
    };

    playerBank.addStacking(itemToAdd);
    updateBankingInterface(details.player);
};


export const withdrawItem: itemInteractionActionHandler = (details) => {
    // Check if player might be spawning widget client-side
    if (!details.player.interfaceState.findWidget(widgets.bank.screenWidget.widgetId)) {
        return;
    }
    // Check if the player has the item
    if (!details.player.hasItemInBank(details.itemId)) {
        return;
    }

    let itemIdToAdd: number = details.itemId;
    let stackable: boolean = details.itemDetails.stackable;
    if (details.player.settings.bankWithdrawNoteMode) {
        const toNoteId: number = toNote(details.itemId);
        if (toNoteId > -1) {
            itemIdToAdd = toNoteId;
            stackable = true;
        } else {
            details.player.sendMessage('This item can not be withdrawn as a note.');
        }
    }

    let countToRemove: number;
    switch (details.option) {
        case 'withdraw-1':
            // Withdraw 1
            countToRemove = 1;
            break;
        case 'withdraw-5':
            // Withdraw 5
            countToRemove = 5;
            break;
        case 'withdraw-10':
            // Withdraw 10
            countToRemove = 10;
            break;
        case 'withdraw-all':
            // Withdraw all
            countToRemove = -1;
            break;
        default:
            // Should never happen
            throw new Error('Unhandled option in banking plugin: ' + details.option);
    }

    const playerBank = details.player.bank;
    const playerInventory = details.player.inventory;
    const slotWithItem = playerBank.findIndex(details.itemId);
    const itemInBank = playerBank.items[slotWithItem];

    if (!itemInBank) {
        logger.error(`Container item was not present, for item id ${details.itemId} in bank, while trying to withdraw`);
        return;
    }

    const itemAmount = itemInBank.amount;
    if (countToRemove === -1 || countToRemove > itemAmount) {
        countToRemove = itemAmount;
    }

    if (!stackable) {
        const slots = playerInventory.getOpenSlotCount();
        if (slots < countToRemove) {
            countToRemove = slots;
        }
    }
    if (!playerInventory.canFit({ itemId: itemIdToAdd, amount: countToRemove }) || countToRemove === 0) {
        details.player.sendMessage('Your inventory is full.');
        return;
    }

    const itemToAdd: Item = {
        itemId: itemIdToAdd,
        amount: removeFromContainer(playerBank, details.itemId, countToRemove)
    };

    if (stackable) {
        playerInventory.add({ itemId: itemToAdd.itemId, amount: itemToAdd.amount });
    } else {
        for(let count = 0; count < itemToAdd.amount; count++) {
            playerInventory.add({ itemId: itemToAdd.itemId, amount: 1 });
        }
    }

    updateBankingInterface(details.player);
};

export const updateBankingInterface = (player: Player) => {
    player.outgoingPackets.sendUpdateAllWidgetItems(widgets.bank.tabWidget, player.inventory);
    player.outgoingPackets.sendUpdateAllWidgetItems(widgets.inventory, player.inventory);
    player.outgoingPackets.sendUpdateAllWidgetItems(widgets.bank.screenWidget, player.bank);
}

/**
 * Removes an item from a container (e.g. bank or inventory) and returns the amount of items it removed.
 * @param from - The container to remove from
 * @param itemId - The item to remove
 * @param amount - The amount to remove
 * @returns The amount of items it removed
 */
export const removeFromContainer = (from: ItemContainer, itemId: number, amount: number) => {
    let resultingAmount = 0;
    let removeAmount = amount;

    while (removeAmount > 0 && from.has(itemId)) {
        const containerIndex = from.findIndex(itemId);
        const containerItem = from.items[containerIndex];

        if (!containerItem) {
            throw new Error(`Container item was not present, for item id ${itemId} in bank, while trying to remove`);
        }

        if (removeAmount >= containerItem.amount) {
            resultingAmount += containerItem.amount;
            removeAmount -= containerItem.amount;
            from.remove(containerIndex);
        } else {
            resultingAmount += removeAmount;
            containerItem.amount -= removeAmount;
            removeAmount = 0;
        }
    }

    return resultingAmount;
}

export const btnAction: buttonActionHandler = (details) => {
    const { player, buttonId } = details;
    player.settingChanged(buttonId);

    const settingsMappings = {
        92: { setting: 'bankWithdrawNoteMode', value: 1 },
        93: { setting: 'bankWithdrawNoteMode', value: 0 },
        98: { setting: 'bankInsertMode', value: 0 },
        99: { setting: 'bankInsertMode', value: 1 },
    };
    if (!settingsMappings[buttonId]) {
        return;
    }

    const config = settingsMappings[buttonId];
    player.settings[config.setting] = config.value;
};

const useBankBoothAction : objectInteractionActionHandler = async (details) => {
    const { player } = details;

    let openBank = false;
    let openPin = false;
    await dialogue([player, { npc: 'rs:generic_banker', key: 'banker' }], [
        banker => [Emote.HAPPY, `Good day, how can I help you?`],
        options => [
            `I'd Like to access my bank account, please.`, [
                execute(() => {
                    openBank = true;
                })
            ],
            `I'd like to check my PIN settings.`, [
                execute(() => {
                    openPin = true;
                })
            ],
            `What is this place?`, [
                player => [Emote.WONDERING, `What is this place?`],
                banker => [Emote.HAPPY, `This is a branch of the Bank of Gielinor. We have branches in many towns.`],
                player => [Emote.WONDERING, `And what do you do?`],
                banker => [Emote.GENERIC, `We will look after your items and money for you.`],
                banker => [Emote.GENERIC, `Leave your valuables with us if you want to keep them safe.`]
            ]
        ]
    ]);

    if (openBank) {
        openBankInterface(details as any);
    } else if (openPin) {
        openPinSettings(details);
    }
};

export default {
    pluginId: 'rs:banking',
    hooks: [
        {
            type: 'object_interaction',
            objectIds: objectIds.bankBooth,
            options: [ 'use' ],
            walkTo: true,
            handler: useBankBoothAction
        }, {
            type: 'object_interaction',
            objectIds: objectIds.bankBooth,
            options: [ 'use-quickly' ],
            walkTo: true,
            handler: openBankInterface
        }, {
            type: 'item_interaction',
            widgets: widgets.bank.tabWidget,
            options: [ 'deposit-1', 'deposit-5', 'deposit-10', 'deposit-all' ],
            handler: depositItem,
        }, {
            type: 'item_interaction',
            widgets: widgets.bank.screenWidget,
            options: [ 'withdraw-1', 'withdraw-5', 'withdraw-10', 'withdraw-all' ],
            handler: withdrawItem,
        }, {
            type: 'button',
            widgetId: widgets.bank.screenWidget.widgetId,
            buttonIds: buttonIds,
            handler: btnAction
        }
    ]
};
