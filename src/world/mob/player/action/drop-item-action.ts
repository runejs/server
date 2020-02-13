import { Player } from '../player';
import { world } from '@server/game-server';
import { Item } from '@server/world/items/item';
import { interfaceIds } from '@server/world/mob/player/game-interface';

export const dropItemAction = (player: Player, item: Item, inventorySlot: number) => {
    player.inventory.remove(inventorySlot);
    // @TODO change packets to only update modified container slots
    player.packetSender.sendUpdateAllInterfaceItems(interfaceIds.inventory, player.inventory);
    player.packetSender.playSound(376, 7);
    world.chunkManager.spawnWorldItem(item, player.position, player, 300);
};
