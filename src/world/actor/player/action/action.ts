import { Player } from '@server/world/actor/player/player';
import { Position } from '@server/world/position';
import { Subject, timer } from 'rxjs';
import { World } from '@server/world/world';
import { LocationObject } from '@runejs/cache-parser';
import { Npc } from '@server/world/actor/npc/npc';

export type ActionCancelType = 'manual-movement' | 'pathing-movement' | 'generic' | 'keep-widgets-open';

/**
 * A type of action where something is being interacted with.
 */
export interface InteractingAction {
    interactingObject?: LocationObject;
}

/**
 * A type of action that loops until either one of three things happens:
 * 1. A player is specified within `options` who's `actionsCancelled` event has been fired during the loop.
 * 2. An npc is specified within `options` who no longer exists at some point during the loop.
 * 3. The `cancel()` function is manually called, presumably when the purpose of the loop has been completed.
 * @param options Options to provide to the looping action, which include:
 * `ticks` the number of game ticks between loop cycles. Defaults to 1 game tick between loops.
 * `delayTicks` the number of game ticks to wait before starting the first loop. Defaults to 0 game ticks.
 * `player` the player that the loop belongs to. Providing this field will cause the loop to cancel if this
 *          player's `actionsCancelled` is fired during the loop.
 * `npc` the npc that the loop belongs to. This will Providing this field will cause the loop to cancel if
 *       this npc is flagged to no longer exist during the loop.
 */
export const loopingAction = (options?: { ticks?: number, delayTicks?: number, npc?: Npc, player?: Player }) => {
    if(!options) {
        options = {};
    }

    const { ticks, delayTicks, npc, player } = options;
    const event: Subject<void> = new Subject<void>();

    const subscription = timer(delayTicks === undefined ? 0 : (delayTicks * World.TICK_LENGTH),
        ticks === undefined ? World.TICK_LENGTH : (ticks * World.TICK_LENGTH)).subscribe(() => {
        if(npc && !npc.exists) {
            event.complete();
            subscription.unsubscribe();
            return;
        }

        event.next();
    });

    let actionCancelled;

    if(player) {
        actionCancelled = player.actionsCancelled.subscribe(() => {
            subscription.unsubscribe();
            actionCancelled.unsubscribe();
            event.complete();
        });
    }

    return { event, cancel: () => {
        subscription.unsubscribe();

        if(actionCancelled) {
            actionCancelled.unsubscribe();
        }

        event.complete();
    } };
};

/**
 * A walk-to type of action that requires the specified player to walk to a specific destination before proceeding.
 * Note that this does not force the player to walk, it simply checks to see if the player is walking where specified.
 * @param player The player that must walk to a specific position.
 * @param position The position that the player needs to end up at.
 * @param interactingAction [optional] The information about the interaction that the player is making. Not required.
 * @TODO change to 600ms / 1 check per game cycle?
 */
export const walkToAction = async (player: Player, position: Position, interactingAction?: InteractingAction): Promise<void> => {
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
                        const locationObject = interactingAction.interactingObject;
                        if(player.position.withinInteractionDistance(locationObject)) {
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
