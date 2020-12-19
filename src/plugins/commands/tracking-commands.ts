import { commandAction } from '@server/world/action/player-command-action';
import { world } from '@server/game-server';
import { logger } from '@runejs/core';

const quadtreeAction: commandAction = (details) => {
    const { player } = details;

    const values = world.playerTree.colliding({
        x: player.position.x - 2,
        y: player.position.y - 2,
        width: 5,
        height: 5
    });

    logger.info(values);
};

const trackedPlayersAction: commandAction = (details) => {
    const { player } = details;
    player.sendLogMessage(`Tracked players: ${player.trackedPlayers.length}`, details.isConsole);

};

const trackedNpcsAction: commandAction = (details) => {
    const { player } = details;
    player.sendLogMessage(`Tracked npcs: ${player.trackedNpcs.length}`, details.isConsole);

};

export default [{
    type: 'player_command',
    commands: 'quadtree',
    action: quadtreeAction
}, {
    type: 'player_command',
    commands: 'trackedplayers',
    action: trackedPlayersAction
}, {
    type: 'player_command',
    commands: 'trackednpcs',
    action: trackedNpcsAction
}];
