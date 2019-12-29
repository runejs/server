import { Player } from '../player';
import { Item } from '../../items/item';
import { interfaceIds } from '../game-interface';

export const unequipItemAction = (player: Player, itemId: number, equipmentSlot: number) => {
    const inventory = player.inventory;
    const inventorySlot = inventory.getFirstOpenSlot();

    if(inventorySlot === -1) {
        player.packetSender.chatboxMessage(`You don't have enough free space to do that.`);
        return;
    }

    const equipment = player.equipment;
    const itemInEquipmentSlot: Item = equipment.items[equipmentSlot];

    if(itemInEquipmentSlot) {
        equipment.remove(equipmentSlot);
        inventory.set(inventorySlot, itemInEquipmentSlot);

        player.packetSender.sendUpdateSingleInterfaceItem(interfaceIds.inventory, inventorySlot, itemInEquipmentSlot);
        player.packetSender.sendUpdateSingleInterfaceItem(interfaceIds.equipment, equipmentSlot, null);
        player.updateBonuses();
        player.updateFlags.appearanceUpdateRequired = true;
    }
};
