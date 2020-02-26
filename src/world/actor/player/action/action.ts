import { Player } from '@server/world/actor/player/player';
import { Position } from '@server/world/position';
import { Subject, timer } from 'rxjs';
import { World } from '@server/world/world';
import { LandscapeObject } from '@runejs/cache-parser';

export interface InteractingAction {
    interactingObject?: LandscapeObject;
}

export const loopingAction = (player: Player, ticks?: number, delayTicks?: number) => {
    const event: Subject<void> = new Subject<void>();

    const subscription = timer(delayTicks === undefined ? 0 : (delayTicks * World.TICK_LENGTH),
        ticks === undefined ? World.TICK_LENGTH : (ticks * World.TICK_LENGTH)).subscribe(() => {
        event.next();
    });

    const actionCancelled = player.actionsCancelled.subscribe(() => {
        subscription.unsubscribe();
        actionCancelled.unsubscribe();
    });

    return { event, cancel: () => {
        subscription.unsubscribe();
        actionCancelled.unsubscribe();
    } };
};

export const walkToAction = (player: Player, position: Position, interactingAction?: InteractingAction): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
        player.walkingTo = position;

        const inter = setInterval(() => {
            if(!player.walkingTo || !player.walkingTo.equals(position)) {
                reject();
                clearInterval(inter);
                return;
            }

            if(!player.walkingQueue.moving()) {
                if(!interactingAction) {
                    if(player.position.distanceBetween(position) > 1) {
                        reject();
                    } else {
                        resolve();
                    }
                } else {
                    if(interactingAction.interactingObject) {
                        const landscapeObject = interactingAction.interactingObject;
                        if(player.position.withinInteractionDistance(landscapeObject)) {
                            resolve();
                        } else {
                            reject();
                        }
                    }
                }

                clearInterval(inter);
                player.walkingTo = null;
            }
        }, 100);
    });
};
