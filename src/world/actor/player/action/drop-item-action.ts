import { Player } from '../player';
import { world } from '@server/game-server';
import { Item } from '@server/world/items/item';
import { widgetIds } from '@server/world/actor/player/widget';

export const dropItemAction = (player: Player, item: Item, inventorySlot: number) => {
    player.inventory.remove(inventorySlot);
    // @TODO change packets to only update modified container slots
    player.outgoingPackets.sendUpdateAllWidgetItems(widgetIds.inventory, player.inventory);
    player.outgoingPackets.playSound(2739, 7);
    world.chunkManager.spawnWorldItem(item, player.position, player, 300);
};
