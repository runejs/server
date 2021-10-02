import { Position } from '@engine/world/position';
import { Player } from '@engine/world/actor/player/player';
import { World } from '@engine/world/world';
import { commandActionHandler } from '@engine/world/action/player-command.action';
import { world } from '@engine/world';


const handler: commandActionHandler = ({ player, args }) => {
    const playerCount = args.playerCount as number;

    if(playerCount > World.MAX_PLAYERS - 1) {
        player.sendMessage(`Error: Max player count is ${World.MAX_PLAYERS - 1}.`);
        return;
    }

    const x: number = player.position.x;
    const y: number = player.position.y;
    let xOffset: number = 0;
    let yOffset: number = 0;

    const spawnChunk = world.chunkManager.getChunkForWorldPosition(new Position(x, y, 0));

    const worldSlotsRemaining = world.playerSlotsRemaining() - 1;
    if(worldSlotsRemaining <= 0) {
        player.sendMessage(`Error: The game world is full.`);
        return;
    }

    const playerSpawnCount = playerCount > worldSlotsRemaining ? worldSlotsRemaining : playerCount;

    if(playerSpawnCount < playerCount) {
        player.sendMessage(`Warning: There was only room for ${playerSpawnCount}/${playerCount} player spawns.`);
    }

    for(let i = 0; i < playerSpawnCount; i++) {
        const testPlayer = new Player(null, null, null, i,
            `test${i}`, 'abs', true);
        world.registerPlayer(testPlayer);
        testPlayer.interfaceState.closeAllSlots();

        xOffset++;

        if(xOffset > 20) {
            xOffset = 0;
            yOffset--;
        }

        testPlayer.position = new Position(x + xOffset, y + yOffset, 0);
        const newChunk = world.chunkManager.getChunkForWorldPosition(testPlayer.position);

        if(!spawnChunk.equals(newChunk)) {
            spawnChunk.removePlayer(testPlayer);
            newChunk.addPlayer(testPlayer);
        }

        testPlayer.initiateRandomMovement();
    }
};


export default {
    pluginId: 'rs:spawn_test_players_command',
    hooks: [
        {
            type: 'player_command',
            commands: [ 'spawn_players', 'spawnplayers' ],
            args: [
                {
                    name: 'playerCount',
                    type: 'number'
                }
            ],
            handler
        }
    ]
};
