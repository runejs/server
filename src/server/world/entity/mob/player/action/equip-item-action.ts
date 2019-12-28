import { Player } from '../player';
import { world } from '../../../../../game-server';
import { logger } from '@runejs/logger/dist/logger';
import { equipmentSlotIndex } from '../../../../config/item-data';
import { Item } from '../../items/item';
import { interfaceIds } from '../game-interface';

export const equipItemAction = (player: Player, itemId: number, inventorySlot: number) => {
    const itemData = world.itemData.get(itemId);

    if(!itemData || !itemData.equipment || !itemData.equipment.slot) {
        logger.warn(`Can not equip item ${itemId}/${itemData.name}`);
        return;
    }

    const inventory = player.inventory;
    const equipment = player.equipment;
    const equipmentSlot = equipmentSlotIndex(itemData.equipment.slot);

    const itemInInventorySlot: Item = inventory.items[inventorySlot];
    const itemInEquipmentSlot: Item = equipment.items[equipmentSlot];

    if(itemInEquipmentSlot) {
        equipment.remove(equipmentSlot);
        inventory.remove(inventorySlot);

        equipment.set(equipmentSlot, itemInInventorySlot);
        inventory.set(inventorySlot, itemInEquipmentSlot);

        player.packetSender.sendUpdateSingleInterfaceItem(interfaceIds.inventory, inventorySlot, itemInEquipmentSlot);
    } else {
        inventory.remove(inventorySlot);
        equipment.set(equipmentSlot, itemInInventorySlot);

        player.packetSender.sendUpdateSingleInterfaceItem(interfaceIds.inventory, inventorySlot, null);
    }

    player.packetSender.sendUpdateSingleInterfaceItem(interfaceIds.equipment, equipmentSlot, itemInInventorySlot);
    player.updateFlags.appearanceUpdateRequired = true;
};
