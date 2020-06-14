import { Actor } from '@server/world/actor/actor';


export const walkToActor = async (actor: Actor, target: Actor): Promise<boolean> => {
    const distance = Math.floor(target.position.distanceBetween(actor.position));
    if(distance > 16) {
        actor.clearFaceActor();
        actor.metadata.faceActorClearedByWalking = true;
        throw new Error(`Distance too great!`);
    }

    let ignoreDestination = true;
    let desiredPosition = target.position;
    if(target.lastMovementPosition) {
        desiredPosition = target.lastMovementPosition;
        ignoreDestination = false;
    }

    await actor.pathfinding.walkTo(desiredPosition, {
        pathingSearchRadius: distance + 2,
        ignoreDestination
    });

    return Promise.resolve(true);
};

export const followActor = (follower: Actor, following: Actor): void => {
    follower.face(following, false, false, false);

    walkToActor(follower, following);

    const subscription = following.movementEvent.subscribe(() => {
        walkToActor(follower, following);
    });
    const actionCancelled = follower.actionsCancelled.subscribe(type => {
        if(type !== 'pathing-movement') {
            subscription.unsubscribe();
            actionCancelled.unsubscribe();
            follower.face(null);
        }
    });
};
