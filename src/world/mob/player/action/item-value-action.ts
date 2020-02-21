import { Player } from '@server/world/mob/player/player';
import { gameCache } from '@server/game-server';
import { logger } from '@runejs/logger/dist/logger';

export const itemValueAction = (player: Player, itemId: number, slot: number) => {
    try {
        const item = gameCache.itemDefinitions.get(itemId);
        player.packetSender.chatboxMessage(`${item.name}: currently costs ${item.value} coins.`);
    } catch (e) {
        logger.error('Error finding item details: ' + e);
        return;
    }
};