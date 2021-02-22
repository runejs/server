import { itemOnObjectAction } from '@server/world/action/item-on-object-action';
import { widgets } from '@server/config';
import { Skill } from '@server/world/actor/skills';
import { barIds, smithables, widgetItems } from '@server/plugins/skills/smithing/forging-constants';
import { itemIds } from '@server/world/config/item-ids';
import { cache } from '@server/game-server';
import { Smithable } from '@server/plugins/skills/smithing/forging-types';
import { itemAction } from '@server/world/action/item-action';

const mapWidgetItemsToFlatArray = (input) => {
    const result = [];
    smithables.forEach((type) => {
        type.forEach((smithable) => {
            result.push(smithable.item.itemId);
        });
    });
    return result;
};

const mapToFlatArray = (input) => {
    const results = [];
    input.forEach((values) => {
        values.forEach((value) => {
            results.push(value);
        });
    });
    return results;
};

const findSmithableByItemId = (itemId) : Smithable => {
    return mapToFlatArray(smithables).find((smithable) => {
        return smithable.item.itemId === itemId;
    });
};

const smithItem : itemAction = (details) => {
    const { player, option, itemDetails } = details;
    const smithable = findSmithableByItemId(itemDetails.id);
    console.log('Option: ', option);
    console.log('Item: ', itemDetails);
    console.log('Smithable: ', smithable);

    console.log(smithable.ingredient.amount + ` > ` + player.inventory.findAll(smithable.ingredient.itemId).length);
    if (smithable.ingredient.amount > player.inventory.findAll(smithable.ingredient.itemId).length) {
        player.interfaceState.closeAllSlots();
        const bar = cache.itemDefinitions.get(smithable.ingredient.itemId);
        player.sendMessage(`You don't have enough ${bar.name}s.`, true);
        return;
    }

    player.playAnimation(898);
};

const openForgingInterface : itemOnObjectAction = (details) => {
    const { player, item } = details;
    const amountInInventory = player.inventory.findAll(item).length;

    // The player does not have a hammer.
    if (!player.inventory.has(itemIds.hammer)) {
        player.sendMessage(`You need a hammer to work the metal with.`, true);
        return;
    }

    player.outgoingPackets.updateClientConfig(210, amountInInventory);
    player.outgoingPackets.updateClientConfig(211, player.skills.getLevel(Skill.SMITHING));

    details.player.interfaceState.openWidget(widgets.anvil.widgetId, {
        slot: 'screen'
    });

    widgetItems.get(item.itemId).forEach((items, containerId) => {
        items.forEach((smithable, index) => {
            player.outgoingPackets.sendUpdateSingleWidgetItem({
                widgetId: widgets.anvil.widgetId, containerId: containerId
            }, index, smithable.item);
        });
    });
};

export default [
    {
        type: 'item_on_object',
        itemIds: barIds,
        objectIds: [2783],
        options: ['use'],
        action:  openForgingInterface
    },
    {
        type: 'item_action',
        itemIds: [...mapWidgetItemsToFlatArray(widgetItems)],
        action: smithItem
    }
];
