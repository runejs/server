import { Player } from '../player';
import { world } from '../../../../../game-server';
import { logger } from '@runejs/logger/dist/logger';
import { equipmentSlotIndex } from '../../../../config/item-data';
import { Item } from '../../items/item';
import { interfaceIds } from '../game-interface';

export const equipItemAction = (player: Player, itemId: number, inventorySlot: number) => {
    const itemData = world.itemData.get(itemId);

    if(!itemData || !itemData.equipmentSlot) {
        logger.warn(`Can not equip item ${itemId}/${itemData.name}`);
        return;
    }

    const inventory = player.inventory;
    const equipment = player.equipment;
    const equipmentSlot = equipmentSlotIndex(itemData.equipmentSlot);

    const itemInInventorySlot: Item = inventory.items[inventorySlot];
    const itemInEquipmentSlot: Item = equipment.items[equipmentSlot];

    if(itemInEquipmentSlot) {
        equipment.removeFromSlot(equipmentSlot);
        inventory.removeFromSlot(inventorySlot);

        equipment.set(equipmentSlot, itemInInventorySlot);
        inventory.set(inventorySlot, itemInEquipmentSlot);
    } else {
        inventory.removeFromSlot(inventorySlot);
        equipment.set(equipmentSlot, itemInInventorySlot);
    }

    // @TODO update only modified slots instead of entire container
    player.packetSender.sendUpdateAllInterfaceItems(interfaceIds.inventory, inventory);
    player.packetSender.sendUpdateAllInterfaceItems(interfaceIds.equipment, equipment);
};
