import { Player } from '../player';
import { interfaceIds } from '../game-interface';

export const swapItemAction = (player: Player, fromSlot: number, toSlot: number, interfaceId: number) => {
    if(interfaceId === interfaceIds.inventory) {
        const inventory = player.inventory;

        if(toSlot > inventory.size - 1 || fromSlot > inventory.size - 1) {
            return;
        }

        inventory.swap(fromSlot, toSlot);
    }
};
