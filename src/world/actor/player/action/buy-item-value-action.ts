import { Player } from '@server/world/actor/player/player';
import { gameCache } from '@server/game-server';
import { logger } from '@runejs/logger/dist/logger';

export const buyItemValueAction = (player: Player, itemId: number, slot: number) => {
    try {
        const item = gameCache.itemDefinitions.get(itemId);
        player.outgoingPackets.chatboxMessage(`${item.name}: currently costs ${item.value} coins.`);
    } catch (e) {
        logger.error('Error finding item details: ' + e);
        return;
    }
};
