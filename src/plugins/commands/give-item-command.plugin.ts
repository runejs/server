import { commandActionHandler } from '@engine/action';
import { filestore } from '@server/game/game-server';
import { itemIds } from '@engine/world/config/item-ids';
import { findItem, itemIdMap } from '@engine/config/config-handler';

const action: commandActionHandler = (details) => {
    const { player, args } = details;

    const inventorySlot = player.inventory.getFirstOpenSlot();

    if(inventorySlot === -1) {
        player.sendLogMessage(`You don't have enough free space to do that.`, details.isConsole);
        return;
    }

    const itemSearch: string = args.itemSearch as string;
    let itemId: number | null = null;

    if(itemSearch.match(/^[0-9]+$/)) {
        itemId = parseInt(itemSearch, 10);
    } else {
        if(itemSearch.indexOf(':') !== -1) {
            itemId = findItem(itemSearch)?.gameId || null;
        } else {
            // @TODO nested item ids
            itemId = itemIds[itemSearch];
        }
    }

    if(!itemId || isNaN(itemId)) {
        throw new Error(`Item name not found.`);
    }

    let amount: number = args.amount as number;

    if(amount > 2000000000) {
        throw new Error(`Unable to give more than 2,000,000,000.`);
    }

    const itemDefinition = findItem(itemId);
    if(!itemDefinition) {
        throw new Error(`Item ID ${itemId} not found!`);
    }

    let actualAmount = 0;
    if(itemDefinition.stackable) {
        const item = { itemId, amount };
        player.giveItem(item);
        actualAmount = amount;
    } else {
        if(amount > 28) {
            amount = 28;
        }

        for(let i = 0; i < amount; i++) {
            if(player.giveItem({ itemId, amount: 1 })) {
                actualAmount++;
            } else {
                break;
            }
        }
    }

    player.sendLogMessage(`Added ${actualAmount}x ${itemDefinition.name} to inventory.`, details.isConsole);

};

export default {
    pluginId: 'rs:give_item_command',
    hooks: [
        {
            type: 'player_command',
            commands: [ 'give', 'item', 'spawn' ],
            args: [
                {
                    name: 'itemSearch',
                    type: 'string'
                },
                {
                    name: 'amount',
                    type: 'number',
                    defaultValue: 1
                }
            ],
            handler: action
        }
    ]
};
