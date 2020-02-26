import { Player } from '../player';
import { world } from '@server/game-server';
import { logger } from '@runejs/logger/dist/logger';
import { EquipmentSlot, equipmentSlotIndex, ItemDetails, WeaponType } from '@server/world/config/item-data';
import { Item } from '@server/world/items/item';
import { widgetIds } from '../widget';
import { ItemContainer } from '@server/world/items/item-container';

export const equipItemAction = (player: Player, itemId: number, inventorySlot: number) => {
    const itemToEquipData = world.itemData.get(itemId);

    if(!itemToEquipData || !itemToEquipData.equipment || !itemToEquipData.equipment.slot) {
        logger.warn(`Can not equip item ${itemId}/${itemToEquipData.name}`);
        return;
    }

    const inventory = player.inventory;
    const equipment = player.equipment;
    const equipmentSlot = equipmentSlotIndex(itemToEquipData.equipment.slot);

    const itemToEquip: Item = inventory.items[inventorySlot];
    const itemToUnequip: Item = equipment.items[equipmentSlot];
    let shouldUnequipOffHand: boolean = false;
    let shouldUnequipMainHand: boolean = false;

    if(itemToEquipData && itemToEquipData.equipment) {
        if(itemToEquipData.equipment.weaponType === WeaponType.TWO_HANDED) {
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
        inventory.remove(inventorySlot, false);

        equipment.set(equipmentSlot, itemToEquip);
        inventory.set(inventorySlot, itemToUnequip);
    } else {
        equipment.set(equipmentSlot, itemToEquip);
        inventory.remove(inventorySlot);

        if(shouldUnequipOffHand) {
            unequipItem(player, inventory, equipment, EquipmentSlot.OFF_HAND);
        }

        if(shouldUnequipMainHand) {
            unequipItem(player, inventory, equipment, EquipmentSlot.MAIN_HAND);
        }
    }

    // @TODO change packets to only update modified container slots
    player.outgoingPackets.sendUpdateAllWidgetItems(widgetIds.inventory, inventory);
    player.outgoingPackets.sendUpdateAllWidgetItems(widgetIds.equipment, equipment);
    // player.updateBonuses(); @TODO move this to when the equipment widget gets opened
    player.updateFlags.appearanceUpdateRequired = true;
};

function unequipItem(player: Player, inventory: ItemContainer, equipment: ItemContainer, slot: EquipmentSlot): boolean {
    const inventorySlot = inventory.getFirstOpenSlot();

    if(inventorySlot === -1) {
        player.outgoingPackets.chatboxMessage(`You don't have enough free space to do that.`);
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
