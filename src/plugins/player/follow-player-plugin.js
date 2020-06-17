import { ActionType } from '../plugin';

module.exports = {
    type: ActionType.PLAYER_ACTION,
    options: 'follow',
    action: details => details.player.follow(details.otherPlayer)
};
