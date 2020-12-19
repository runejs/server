import { buttonAction } from '@server/world/action/button-action';
import { world } from '@server/game-server';
import { widgets } from '@server/config';

export const action: buttonAction = (details) => {
    const { player } = details;
    const playerName = player.username.toLowerCase();
    player.logout();

    // Update online players friends lists that have this player as a friend
    const otherPlayers = world.playerList.filter(p => p && p.friendsList.indexOf(playerName) !== -1);
    if(otherPlayers && otherPlayers.length !== 0) {
        otherPlayers.forEach(otherPlayer => otherPlayer.outgoingPackets.updateFriendStatus(playerName, 0));
    }
};

export default { type: 'button', widgetId: widgets.logoutTab, buttonIds: 6, action };
