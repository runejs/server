import { PrivateMessaging } from '@engine/world/actor/player/private-messaging';
import { playerInitActionHandler } from '@engine/action/pipe/player-init.action';


export const handler: playerInitActionHandler = ({ player }) => {
    PrivateMessaging.playerLoggedIn(player);
    player.outgoingPackets.sendFriendServerStatus(2);
};

export default {
    pluginId: 'rs:update_friends_list',
    hooks: [
        { type: 'player_init', handler }
    ]
};
