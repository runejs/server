import { ActionType, RunePlugin } from '@server/plugins/plugin';
import { playerAction } from '@server/world/actor/player/action/player-action';
import { loopingAction } from '@server/world/actor/player/action/action';
import { Position } from '@server/world/position';

export const action: playerAction = (details) => {
    const { player, otherPlayer } = details;

    player.face(otherPlayer, false, false, false);

    let followingPosition: Position = new Position(otherPlayer.position.x, otherPlayer.position.y, otherPlayer.position.level);

    const loop = loopingAction();

    loop.event.subscribe(async () => {
        if(player.metadata.pathfinding) {
            return;
        }

        const distance = Math.floor(otherPlayer.position.distanceBetween(player.position));
        if(distance > 16) {
            loop.cancel();
            player.clearFaceActor();
            player.metadata.faceActorClearedByWalking = true;
            return;
        }

        console.log(distance);

        if(distance > 1 && !followingPosition.equals(otherPlayer.position)) {
            followingPosition = new Position(otherPlayer.position.x, otherPlayer.position.y, otherPlayer.position.level);

            try {
                player.metadata.pathfinding = true;
                await player.pathfinding.walkTo(otherPlayer.position, { pathingDiameter: distance + 5, ignoreDestination: true });
                player.metadata.pathfinding = false;
            } catch(error) {
            }
        }
    });
};

export default new RunePlugin({
    type: ActionType.PLAYER_ACTION,
    options: 'follow',
    action
});
