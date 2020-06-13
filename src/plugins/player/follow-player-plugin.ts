import { ActionType, RunePlugin } from '@server/plugins/plugin';
import { playerAction } from '@server/world/actor/player/action/player-action';
import { Player } from '@server/world/actor/player/player';


async function pathTo(player: Player, otherPlayer: Player): Promise<boolean> {
    const distance = Math.floor(otherPlayer.position.distanceBetween(player.position));
    if(distance > 16) {
        player.clearFaceActor();
        player.metadata.faceActorClearedByWalking = true;
        throw new Error(`Distance too great!`);
    }

    let ignoreDestination = true;
    let desiredPosition = otherPlayer.position;
    if(otherPlayer.lastMovementPosition/* && otherPlayer.lastMovementPosition.distanceBetween(otherPlayer.position) < 1*/) {
        desiredPosition = otherPlayer.lastMovementPosition;
        ignoreDestination = false;
    }

    await player.pathfinding.walkTo(desiredPosition, {
        pathingSearchRadius: distance + 2,
        ignoreDestination
    });

    return Promise.resolve(true);
}

export const action: playerAction = (details) => {
    const { player, otherPlayer } = details;

    player.face(otherPlayer, false, false, false);

    pathTo(player, otherPlayer);

    const subscription = otherPlayer.movementEvent.subscribe(() => {
        player.face(otherPlayer, false, false, false);
        pathTo(player, otherPlayer);
    });
    const actionCancelled = player.actionsCancelled.subscribe(type => {
        if(type !== 'pathing-movement') {
            subscription.unsubscribe();
            actionCancelled.unsubscribe();
            player.face(null);
        }
    });
};

export default new RunePlugin({
    type: ActionType.PLAYER_ACTION,
    options: 'follow',
    action
});
