import { ActionType, RunePlugin } from '@server/plugins/plugin';
import { widgets } from '@server/world/config/widget';
import { getItemFromContainer, itemAction } from '@server/world/actor/player/action/item-action';
import { updateBonusStrings } from '@server/plugins/equipment/equipment-stats-plugin';
import { EquipmentSlot, equipmentSlotIndex, ItemDetails, WeaponType } from '@server/world/config/item-data';
import { Item } from '@server/world/items/item';
import { world } from '@server/game-server';
import { Player } from '@server/world/actor/player/player';
import { ItemContainer } from '@server/world/items/item-container';

function unequipItem(player: Player, inventory: ItemContainer, equipment: ItemContainer, slot: EquipmentSlot): boolean {
    const inventorySlot = inventory.getFirstOpenSlot();

    if(inventorySlot === -1) {
        player.sendMessage(`You don't have enough free space to do that.`);
        return false;
    }

    const itemInSlot = equipment.items[slot];

    if(!itemInSlot) {
        return true;
    }

    equipment.remove(slot);
    inventory.set(inventorySlot, itemInSlot);
    return true;
}

export const action: itemAction = (details) => {
    const { player, itemId, itemSlot, itemDetails, widgetId } = details;

    const inventory = player.inventory;
    const equipment = player.equipment;
    const itemToEquip = getItemFromContainer(itemId, itemSlot, inventory);

    if(!itemToEquip) {
        // The specified item was not found in the specified slot.
        return;
    }

    if(!itemDetails || !itemDetails.equipment || !itemDetails.equipment.slot) {
        player.sendMessage(`Unable to equip item ${itemId}/${itemDetails.name}: Missing equipment data.`);
        return;
    }

    const equipmentSlot = equipmentSlotIndex(itemDetails.equipment.slot);

    const itemToUnequip: Item = equipment.items[equipmentSlot];
    let shouldUnequipOffHand: boolean = false;
    let shouldUnequipMainHand: boolean = false;

    if(itemDetails && itemDetails.equipment) {
        if(itemDetails.equipment.weaponType === WeaponType.TWO_HANDED) {
            shouldUnequipOffHand = true;
        }

        if(equipmentSlot === EquipmentSlot.OFF_HAND && equipment.items[EquipmentSlot.MAIN_HAND]) {
            const mainHandItemData: ItemDetails = world.itemData.get(equipment.items[EquipmentSlot.MAIN_HAND].itemId);

            if(mainHandItemData && mainHandItemData.equipment && mainHandItemData.equipment.weaponType === WeaponType.TWO_HANDED) {
                shouldUnequipMainHand = true;
            }
        }
    }

    if(itemToUnequip) {
        if(shouldUnequipOffHand && !unequipItem(player, inventory, equipment, EquipmentSlot.OFF_HAND)) {
            return;
        }

        if(shouldUnequipMainHand && !unequipItem(player, inventory, equipment, EquipmentSlot.MAIN_HAND)) {
            return;
        }

        equipment.remove(equipmentSlot, false);
        inventory.remove(itemSlot, false);

        equipment.set(equipmentSlot, itemToEquip);
        inventory.set(itemSlot, itemToUnequip);
    } else {
        equipment.set(equipmentSlot, itemToEquip);
        inventory.remove(itemSlot);

        if(shouldUnequipOffHand) {
            unequipItem(player, inventory, equipment, EquipmentSlot.OFF_HAND);
        }

        if(shouldUnequipMainHand) {
            unequipItem(player, inventory, equipment, EquipmentSlot.MAIN_HAND);
        }
    }

    player.updateBonuses();

    // @TODO change packets to only update modified container slots
    player.outgoingPackets.sendUpdateAllWidgetItems(widgets.inventory, inventory);
    player.outgoingPackets.sendUpdateAllWidgetItems(widgets.equipment, equipment);

    if(player.hasWidgetOpen(widgets.equipmentStats.widgetId)) {
        player.outgoingPackets.sendUpdateAllWidgetItems(widgets.equipmentStats, equipment);
        updateBonusStrings(player);
    }

    player.updateFlags.appearanceUpdateRequired = true;
};

export default new RunePlugin({
    type: ActionType.ITEM_ACTION,
    widgets: widgets.inventory,
    options: 'equip',
    action,
    cancelOtherActions: false
});
