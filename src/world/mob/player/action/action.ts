import { Player } from '@server/world/mob/player/player';
import { Position } from '@server/world/position';

export const walkToAction = (player: Player, position: Position): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
        player.walkingTo = position;

        const inter = setInterval(() => {
            if(!player.walkingTo || !player.walkingTo.equals(position)) {
                clearInterval(inter);
                reject();
                return;
            }

            if(!player.walkingQueue.moving()) {
                if(player.position.distanceBetween(position) > 1) {
                    reject();
                } else {
                    resolve();
                }

                clearInterval(inter);
                player.walkingTo = null;
            }
        }, 100);
    });
};
