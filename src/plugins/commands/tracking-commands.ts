import { ActionType, RunePlugin } from '@server/plugins/plugin';
import { commandAction } from '@server/world/actor/player/action/input-command-action';
import { world } from '@server/game-server';

const quadtreeAction: commandAction = (details) => {
    const { player } = details;

    const values = world.playerTree.colliding({
        x: player.position.x - 2,
        y: player.position.y - 2,
        width: 5,
        height: 5
    });

    console.log(values);
};

const trackedPlayersAction: commandAction = (details) => {
    const { player } = details;
    player.sendLogMessage(`Tracked players: ${player.trackedPlayers.length}`, details.isConsole);

};

const trackedNpcsAction: commandAction = (details) => {
    const { player } = details;
    player.sendLogMessage(`Tracked npcs: ${player.trackedNpcs.length}`, details.isConsole);

};

export default new RunePlugin([{
    type: ActionType.COMMAND,
    commands: 'quadtree',
    action: quadtreeAction
}, {
    type: ActionType.COMMAND,
    commands: 'trackedplayers',
    action: trackedPlayersAction
}, {
    type: ActionType.COMMAND,
    commands: 'trackednpcs',
    action: trackedNpcsAction
}]);
