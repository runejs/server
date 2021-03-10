import { world } from '../../game-engine/game-server';

module.exports = {
    type: 'player_command',
    commands: 'follow',
    action: details => details.player.follow(world.npcList[0])
};
