import { ActionType, RunePlugin } from '@server/plugins/plugin';
import { widgetIds } from '@server/world/config/widget';
import { getItemFromContainer, itemAction } from '@server/world/actor/player/action/item-action';
import { updateBonusStrings } from '@server/plugins/equipment/equipment-stats-plugin';

export const action: itemAction = (details) => {
    const { player, itemId, itemSlot, widgetId } = details;

    const equipment = player.equipment;
    const item = getItemFromContainer(itemId, itemSlot, equipment);

    if(!item) {
        // The specified item was not found in the specified slot.
        return;
    }

    const inventory = player.inventory;
    const inventorySlot = inventory.getFirstOpenSlot();

    if(inventorySlot === -1) {
        player.outgoingPackets.chatboxMessage(`You don't have enough free space to do that.`);
        return;
    }

    equipment.remove(itemSlot);
    inventory.set(inventorySlot, item);

    player.updateBonuses();

    player.outgoingPackets.sendUpdateSingleWidgetItem(widgetIds.inventory, inventorySlot, item);
    player.outgoingPackets.sendUpdateSingleWidgetItem(widgetIds.equipment, itemSlot, null);

    if(widgetId === widgetIds.equipmentStats.widgetId) {
        player.outgoingPackets.sendUpdateSingleWidgetItem(widgetIds.equipmentStats, itemSlot, null);
        updateBonusStrings(player);
    }

    player.updateFlags.appearanceUpdateRequired = true;
};

export default new RunePlugin({
    type: ActionType.ITEM_ACTION,
    widgets: [
        widgetIds.equipment,
        widgetIds.equipmentStats
    ],
    options: 'option-1',
    action,
    cancelOtherActions: false
});
