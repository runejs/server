import { ActionType, RunePlugin } from '@server/plugins/plugin';
import { playerAction } from '@server/world/actor/player/action/player-action';
import { loopingAction } from '@server/world/actor/player/action/action';
import { Position } from '@server/world/position';
import { Player } from '@server/world/actor/player/player';

async function pathTo(player: Player, otherPlayer: Player): Promise<boolean> {
    const distance = Math.floor(otherPlayer.position.distanceBetween(player.position));
    if(distance > 16) {
        console.log('too big ', distance);
        player.clearFaceActor();
        player.metadata.faceActorClearedByWalking = true;
        throw `Distance too great!`;
    }

    if(distance <= 1) {
        return Promise.resolve(false);
    }

    await player.pathfinding.walkTo(otherPlayer.position, { pathingDiameter: distance + 6, ignoreDestination: true })/*.catch(() => {})*/;
    return Promise.resolve(true);
}

export const action: playerAction = (details) => {
    const { player, otherPlayer } = details;

    player.face(otherPlayer, false, false, false);

    pathTo(player, otherPlayer);

    const subscription = otherPlayer.movementEvent.subscribe(() => {
        pathTo(player, otherPlayer);
    });
    /*const actionCancelled = player.actionsCancelled.subscribe(() => {
        subscription.unsubscribe();
        actionCancelled.unsubscribe();
    });*/

    /*const loop = loopingAction({ ticks: 2 });

    loop.event.subscribe(async () => {
        const distance = Math.floor(otherPlayer.position.distanceBetween(player.position));
        if(distance > 16) {
            loop.cancel();
            player.clearFaceActor();
            player.metadata.faceActorClearedByWalking = true;
            return;
        }

        if(player.metadata.pathfindingPosition) {
            if(otherPlayer.position.equals(player.metadata.pathfindingPosition)) {
                return;
            } else if(distance === 1) {
                player.metadata.pathfindingPosition = null;
            }
        }

        console.log(distance);

        if(distance > 1 && !followingPosition.equals(otherPlayer.position)) {
            followingPosition = new Position(otherPlayer.position.x, otherPlayer.position.y, otherPlayer.position.level);

            try {
                player.metadata.pathfindingPosition = otherPlayer.position;
                await player.pathfinding.walkTo(otherPlayer.position, { pathingDiameter: distance + 5, ignoreDestination: true });
            } catch(error) {
            }
        }
    });*/
};

export default new RunePlugin({
    type: ActionType.PLAYER_ACTION,
    options: 'follow',
    action
});
