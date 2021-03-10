import { playerInitAction } from '@engine/world/actor/player/player';
import { PrivateMessaging } from '@engine/world/actor/player/private-messaging';

export const action: playerInitAction = (details) => {
    const { player } = details;

    PrivateMessaging.playerLoggedIn(player);
    player.outgoingPackets.sendFriendServerStatus(2);
};

export default { type: 'player_init', action };
