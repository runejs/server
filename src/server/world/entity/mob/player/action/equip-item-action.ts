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

    // @TODO unfuck 2h code

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
        if(shouldUnequipOffHand && !unequipOffhand(player, inventory, equipment)) {
            return;
        }

        if(shouldUnequipMainHand && !unequipMainhand(player, inventory, equipment)) {
            return;
        }

        equipment.remove(equipmentSlot);
        inventory.remove(inventorySlot);

        equipment.set(equipmentSlot, itemToEquip);
        inventory.set(inventorySlot, itemToUnequip);

        player.packetSender.sendUpdateSingleInterfaceItem(interfaceIds.inventory, inventorySlot, itemToUnequip);
    } else {
        inventory.remove(inventorySlot);
        equipment.set(equipmentSlot, itemToEquip);

        let clearSlot: boolean = true;

        if(shouldUnequipOffHand && unequipOffhand(player, inventory, equipment)) {
            clearSlot = false;
        }

        if(shouldUnequipMainHand && unequipMainhand(player, inventory, equipment)) {
            clearSlot = false;
        }

        if(clearSlot) {
            player.packetSender.sendUpdateSingleInterfaceItem(interfaceIds.inventory, inventorySlot, null);
        }
    }

    player.packetSender.sendUpdateSingleInterfaceItem(interfaceIds.equipment, equipmentSlot, itemToEquip);
    player.updateFlags.appearanceUpdateRequired = true;
};

function unequipMainhand(player: Player, inventory: ItemContainer, equipment: ItemContainer): boolean {
    const mainHandItemInventorySlot = inventory.getFirstOpenSlot();

    if(mainHandItemInventorySlot === -1) {
        player.packetSender.sendChatboxMessage(`You don't have enough free space to do that.`);
        return false;
    }

    const mainHandSlot = EquipmentSlot.MAIN_HAND;
    const mainHandItem = equipment.items[mainHandSlot];

    if(!mainHandItem) {
        return true;
    }

    equipment.remove(mainHandSlot);
    inventory.set(mainHandItemInventorySlot, mainHandItem);
    player.packetSender.sendUpdateSingleInterfaceItem(interfaceIds.inventory, mainHandItemInventorySlot, mainHandItem);
    player.packetSender.sendUpdateSingleInterfaceItem(interfaceIds.equipment, mainHandSlot, null);
    return true;
}

function unequipOffhand(player: Player, inventory: ItemContainer, equipment: ItemContainer): boolean {
    const offHandItemInventorySlot = inventory.getFirstOpenSlot();

    if(offHandItemInventorySlot === -1) {
        player.packetSender.sendChatboxMessage(`You don't have enough free space to do that.`);
        return false;
    }

    const offHandSlot = EquipmentSlot.OFF_HAND;
    const offHandItem = equipment.items[offHandSlot];

    if(!offHandItem) {
        return true;
    }

    equipment.remove(offHandSlot);
    inventory.set(offHandItemInventorySlot, offHandItem);
    player.packetSender.sendUpdateSingleInterfaceItem(interfaceIds.inventory, offHandItemInventorySlot, offHandItem);
    player.packetSender.sendUpdateSingleInterfaceItem(interfaceIds.equipment, offHandSlot, null);
    return true;
}
