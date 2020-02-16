import { Player } from '@server/world/mob/player/player';
import { Position } from '@server/world/position';
import { Subject, timer } from 'rxjs';
import { World } from '@server/world/world';

export const loopingAction = (player: Player, ticks?: number, delayTicks?: number) => {
    const event: Subject<void> = new Subject<void>();

    const subscription = timer(delayTicks === undefined ? 0 : (delayTicks * World.TICK_LENGTH),
        ticks === undefined ? World.TICK_LENGTH : (ticks * World.TICK_LENGTH)).subscribe(() => {
        event.next();
    });

    const actionCancelled = player.actionsCancelled.subscribe(() => {
        subscription.unsubscribe();
        actionCancelled.unsubscribe();
        player.packetSender.chatboxMessage('Unsubscribed');
    });

    return { event, cancel: () => {
        subscription.unsubscribe();
        actionCancelled.unsubscribe();
        player.packetSender.chatboxMessage('Completed');
    } };
};

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
