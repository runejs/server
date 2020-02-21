import { Player } from '@server/world/mob/player/player';
import { gameCache } from '@server/game-server';
import { logger } from '@runejs/logger/dist/logger';

export const sellItemValueAction = (player: Player, itemId: number, slot: number) => {
    try {
        const item = gameCache.itemDefinitions.get(itemId);

        // TODO: Selling price should never be as high as the buying price.
        console.log('Shop inventory value option handled.');

    } catch (e) {
        logger.error('Error finding item details: ' + e);
        return;
    }
};