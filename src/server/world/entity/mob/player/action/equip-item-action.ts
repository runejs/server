import { Player } from '../player';
import { world } from '../../../../../game-server';
import { logger } from '@runejs/logger/dist/logger';
import { EquipmentSlot, equipmentSlotIndex, ItemData, WeaponType } from '../../../../config/item-data';
import { Item } from '../../items/item';
import { interfaceIds } from '../game-interface';
import { ItemContainer } from '../../items/item-container';

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
            const mainHandItemData: ItemData = world.itemData.get(equipment.items[EquipmentSlot.MAIN_HAND].itemId);

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

        equipment.remove(equipmentSlot);
        inventory.remove(inventorySlot);

        equipment.set(equipmentSlot, itemToEquip);
        inventory.set(inventorySlot, itemToUnequip);
    } else {
        inventory.remove(inventorySlot);
        equipment.set(equipmentSlot, itemToEquip);

        if(shouldUnequipOffHand) {
            unequipItem(player, inventory, equipment, EquipmentSlot.OFF_HAND);
        }

        if(shouldUnequipMainHand) {
            unequipItem(player, inventory, equipment, EquipmentSlot.MAIN_HAND);
        }
    }

    // @TODO change packets to only update modified container slots

    player.packetSender.sendUpdateAllInterfaceItems(interfaceIds.inventory, inventory);
    player.packetSender.sendUpdateAllInterfaceItems(interfaceIds.equipment, equipment);
    player.updateBonuses();
    player.updateFlags.appearanceUpdateRequired = true;
};

function unequipItem(player: Player, inventory: ItemContainer, equipment: ItemContainer, slot: EquipmentSlot): boolean {
    const inventorySlot = inventory.getFirstOpenSlot();

    if(inventorySlot === -1) {
        player.packetSender.chatboxMessage(`You don't have enough free space to do that.`);
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
