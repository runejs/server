import { Player } from '../player';
import { Item } from '@server/world/items/item';
import { widgetIds } from '../widget';

export const unequipItemAction = (player: Player, itemId: number, equipmentSlot: number) => {
    const inventory = player.inventory;
    const inventorySlot = inventory.getFirstOpenSlot();

    if(inventorySlot === -1) {
        player.outgoingPackets.chatboxMessage(`You don't have enough free space to do that.`);
        return;
    }

    const equipment = player.equipment;
    const itemInEquipmentSlot: Item = equipment.items[equipmentSlot];

    if(itemInEquipmentSlot) {
        equipment.remove(equipmentSlot);
        inventory.set(inventorySlot, itemInEquipmentSlot);

        player.outgoingPackets.sendUpdateSingleWidgetItem(widgetIds.inventory, inventorySlot, itemInEquipmentSlot);
        player.outgoingPackets.sendUpdateSingleWidgetItem(widgetIds.equipment, equipmentSlot, null);
        // player.updateBonuses(); @TODO move to when the equipment widget is opened
        player.updateFlags.appearanceUpdateRequired = true;
    }
};
