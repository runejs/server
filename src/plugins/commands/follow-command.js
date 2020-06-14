import { ActionType } from '../plugin';
import { world } from '../../game-server';
import { followActor } from '../../world/actor/player/action/follow-action';

module.exports = {
    type: ActionType.COMMAND,
    commands: 'follow',
    action: details => followActor(details.player, world.npcList[0])
};
