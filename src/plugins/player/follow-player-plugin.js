import { ActionType } from '../plugin';
import { followActor } from '../../world/actor/player/action/follow-action';

module.exports = {
    type: ActionType.PLAYER_ACTION,
    options: 'follow',
    action: details => followActor(details.player, details.otherPlayer)
};
