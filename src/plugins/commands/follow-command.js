import { ActionType } from '../plugin';
import { world } from '../../game-server';

module.exports = {
    type: ActionType.COMMAND,
    commands: 'follow',
    action: details => details.player.follow(world.npcList[0])
};
