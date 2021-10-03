import { buttonActionHandler } from '@engine/action/button.action';
import { widgets } from '@engine/config/config-handler';
import { activeWorld } from '@engine/world';


export const handler: buttonActionHandler = (details) => {
    const { player } = details;
    const playerName = player.username.toLowerCase();
    player.logout();

    // Update online players friends lists that have this player as a friend
    const otherPlayers = activeWorld.playerList.filter(p => p && p.friendsList.indexOf(playerName) !== -1);
    if(otherPlayers && otherPlayers.length !== 0) {
        otherPlayers.forEach(otherPlayer => otherPlayer.outgoingPackets.updateFriendStatus(playerName, 0));
    }
};


export default {
    pluginId: 'rs:logout_button',
    hooks: [
        {
            type: 'button',
            widgetId: widgets.logoutTab,
            buttonIds: 6,
            handler
        }
    ]
};
